import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { PrismaClient, Prisma } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The bill's attached PDF is GENERATED from its own data (below), so the document
// matches the bill. No object storage (S3) for the MVP — the blob lives in the DB.

// --- date helpers (relative to run time) ---------------------------------
const now = new Date();
const day = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(now.getTime() + n * day);

// --- line item helper: builds items and returns their reconciled total ----
type SeedLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  type: "EXPENSE" | "ITEM";
  category?: string;
};

function lineItems(items: SeedLineItem[], taxRate = 0) {
  const create = items.map((it, order) => ({
    description: it.description,
    quantity: new Prisma.Decimal(it.quantity),
    unitPrice: new Prisma.Decimal(it.unitPrice),
    total: new Prisma.Decimal(it.quantity * it.unitPrice),
    type: it.type,
    category: it.category ?? null,
    order,
  }));
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  // `amount` is the grand total the payer owes: subtotal + tax (invariant).
  return {
    create,
    amount: new Prisma.Decimal(subtotal + tax),
    tax: new Prisma.Decimal(tax),
  };
}

// --- invoice PDF generator: renders a bill's own data into a simple invoice ---
type BillForPdf = {
  number: string;
  currency: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: Prisma.Decimal;
  tax: Prisma.Decimal;
  vendor: { name: string; email: string | null };
  lineItems: {
    description: string;
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    total: Prisma.Decimal;
  }[];
};

// StandardFonts (WinAnsi) can't encode every glyph; drop em/en dashes and any
// non-Latin1 char so drawText never throws on seed data.
const safe = (s: string) =>
  s.replace(/[—–]/g, "-").replace(/[^\x00-\xFF]/g, "");

async function invoicePdf(bill: BillForPdf): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const dark = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.45, 0.45, 0.45);
  const margin = 50;
  let y = height - margin;

  const text = (
    s: string,
    x: number,
    size = 10,
    f = font,
    color = dark
  ) => page.drawText(safe(s), { x, y, size, font: f, color });

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const money = (n: Prisma.Decimal | number) =>
    `${bill.currency} ${Number(n).toFixed(2)}`;

  // Header: vendor + "INVOICE"
  text(bill.vendor.name, margin, 20, bold);
  const invLabel = "INVOICE";
  page.drawText(invLabel, {
    x: width - margin - bold.widthOfTextAtSize(invLabel, 20),
    y,
    size: 20,
    font: bold,
    color: gray,
  });
  y -= 18;
  if (bill.vendor.email) {
    text(bill.vendor.email, margin, 10, font, gray);
  }
  y -= 34;

  // Meta
  text(`Invoice #: ${bill.number}`, margin, 10, bold);
  y -= 15;
  text(`Invoice date: ${iso(bill.invoiceDate)}`, margin, 10);
  y -= 15;
  text(`Due date: ${iso(bill.dueDate)}`, margin, 10);
  y -= 28;

  // Table header
  const cQty = 320;
  const cUnit = 400;
  const cAmt = 480;
  text("Description", margin, 9, bold, gray);
  text("Qty", cQty, 9, bold, gray);
  text("Unit", cUnit, 9, bold, gray);
  text("Amount", cAmt, 9, bold, gray);
  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 16;

  // Rows
  for (const li of bill.lineItems) {
    text(li.description.slice(0, 46), margin, 10);
    text(String(Number(li.quantity)), cQty, 10);
    text(Number(li.unitPrice).toFixed(2), cUnit, 10);
    text(Number(li.total).toFixed(2), cAmt, 10);
    y -= 15;
  }

  y -= 8;
  page.drawLine({
    start: { x: cUnit, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 16;

  // Totals
  const subtotal = Number(bill.amount) - Number(bill.tax);
  text("Subtotal", cUnit, 10, font, gray);
  text(money(subtotal), cAmt, 10);
  y -= 15;
  text("Tax", cUnit, 10, font, gray);
  text(money(bill.tax), cAmt, 10);
  y -= 17;
  text("Total due", cUnit, 11, bold);
  text(money(bill.amount), cAmt, 11, bold);

  // Fresh ArrayBuffer-backed array so Prisma's Bytes type is satisfied.
  return new Uint8Array(await doc.save());
}

async function main() {
  // Reset to a known state (repeatable) — delete children first.
  await prisma.payment.deleteMany();
  await prisma.billLineItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  // --- Payment method catalog --------------------------------------------
  // The two methods the app offers (see PaymentMethodSection). A bill picks one
  // via `Bill.paymentMethod` (slug); Payments link to the PaymentMethod row.
  const [ach, check] = await Promise.all(
    [
      { slug: "ach", description: "ACH bank transfer" },
      { slug: "check", description: "Paper check" },
    ].map((data) => prisma.paymentMethod.create({ data }))
  );

  // --- Users -------------------------------------------------------------
  const ana = await prisma.user.create({
    data: { name: "Ana Torres", email: "ana@trashlab.co" },
  });
  const bruno = await prisma.user.create({
    data: { name: "Bruno Díaz", email: "bruno@trashlab.co" },
  });
  const carla = await prisma.user.create({
    data: { name: "Carla Méndez", email: "carla@trashlab.co" },
  });

  // --- Vendors -----------------------------------------------------------
  // Vendor logos via Clearbit; the avatar falls back to initials if one fails.
  const vercel = await prisma.vendor.create({
    data: {
      name: "Vercel",
      email: "ap@vercel.com",
      address: "San Francisco, CA",
      img: "https://logo.clearbit.com/vercel.com",
    },
  });
  const aws = await prisma.vendor.create({
    data: {
      name: "Amazon Web Services",
      email: "billing@aws.com",
      address: "Seattle, WA",
      img: "https://logo.clearbit.com/aws.amazon.com",
    },
  });
  const figma = await prisma.vendor.create({
    data: {
      name: "Figma",
      email: "ap@figma.com",
      address: "San Francisco, CA",
      img: "https://logo.clearbit.com/figma.com",
    },
  });
  const linear = await prisma.vendor.create({
    data: {
      name: "Linear",
      email: "billing@linear.app",
      img: "https://logo.clearbit.com/linear.app",
    },
  });
  const notion = await prisma.vendor.create({
    data: {
      name: "Notion Labs",
      email: "ap@notion.so",
      img: "https://logo.clearbit.com/notion.so",
    },
  });
  const slack = await prisma.vendor.create({
    data: {
      name: "Slack",
      email: "billing@slack.com",
      address: "San Francisco, CA",
      img: "https://logo.clearbit.com/slack.com",
    },
  });
  const github = await prisma.vendor.create({
    data: {
      name: "GitHub",
      email: "billing@github.com",
      address: "San Francisco, CA",
      img: "https://logo.clearbit.com/github.com",
    },
  });
  const datadog = await prisma.vendor.create({
    data: {
      name: "Datadog",
      email: "ap@datadoghq.com",
      address: "New York, NY",
      img: "https://logo.clearbit.com/datadoghq.com",
    },
  });

  // --- Bills (spread across the lifecycle) -------------------------------
  // `paymentMethod` (ach/check) is the method chosen for the bill — shown on the
  // bill view and used at Pay. Payments exist only for PAID/FAILED bills: the app
  // creates a Payment at Pay time, so DRAFT/REVIEWED/APPROVED have none.

  // ===== Ready for review (DRAFT) =======================================

  // Just uploaded, not yet reviewed.
  const notionItems = lineItems([
    { description: "Notion Plus — 12 seats", quantity: 12, unitPrice: 8, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "NOT-1090",
      status: "DRAFT",
      source: "MANUAL",
      amount: notionItems.amount,
      tax: notionItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-3),
      dueDate: daysFromNow(25),
      paymentMethod: "ach",
      vendorId: notion.id,
      uploadedById: ana.id,
      lineItems: { create: notionItems.create },
    },
  });

  // OCR-ingested, past due => derives as OVERDUE.
  const figmaItems = lineItems(
    [{ description: "Figma Organization — annual", quantity: 30, unitPrice: 45, type: "EXPENSE", category: "Software" }],
    0.085
  );
  await prisma.bill.create({
    data: {
      number: "FIG-2043",
      status: "DRAFT",
      source: "OCR",
      amount: figmaItems.amount,
      tax: figmaItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-40),
      dueDate: daysFromNow(-5), // past due, not paid => overdue
      paymentMethod: "ach",
      vendorId: figma.id,
      uploadedById: bruno.id,
      lineItems: { create: figmaItems.create },
    },
  });

  // Small, just landed by email.
  const githubItems = lineItems([
    { description: "GitHub Team — 25 seats", quantity: 25, unitPrice: 4, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "GH-3312",
      status: "DRAFT",
      source: "EMAIL",
      amount: githubItems.amount,
      tax: githubItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-1),
      dueDate: daysFromNow(29),
      paymentMethod: "ach",
      vendorId: github.id,
      uploadedById: ana.id,
      lineItems: { create: githubItems.create },
    },
  });

  // ===== Awaiting approval (REVIEWED) ===================================

  // Reviewed, waiting for approval (no approver yet).
  const vercelReviewItems = lineItems([
    { description: "Vercel Pro — 8 seats", quantity: 8, unitPrice: 20, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "VER-3088",
      status: "REVIEWED",
      source: "EMAIL",
      amount: vercelReviewItems.amount,
      tax: vercelReviewItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-5),
      dueDate: daysFromNow(20),
      paymentMethod: "ach",
      vendorId: vercel.id,
      uploadedById: bruno.id,
      lineItems: { create: vercelReviewItems.create },
    },
  });

  // Larger infra bill with tax; method set to check.
  const datadogItems = lineItems(
    [
      { description: "Datadog APM — 40 hosts", quantity: 40, unitPrice: 31, type: "EXPENSE", category: "Infrastructure" },
      { description: "Log management", quantity: 1, unitPrice: 900, type: "EXPENSE", category: "Infrastructure" },
    ],
    0.085
  );
  await prisma.bill.create({
    data: {
      number: "DD-8842",
      status: "REVIEWED",
      source: "OCR",
      amount: datadogItems.amount,
      tax: datadogItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-4),
      dueDate: daysFromNow(11),
      paymentMethod: "check",
      vendorId: datadog.id,
      uploadedById: ana.id,
      lineItems: { create: datadogItems.create },
    },
  });

  // ===== Ready for release (APPROVED + FAILED) ==========================

  // Approved, ready to pay by ACH; no payment yet.
  const linearItems = lineItems([
    { description: "Linear — 40 seats", quantity: 40, unitPrice: 8, type: "EXPENSE", category: "Software" },
    { description: "Onboarding setup", quantity: 1, unitPrice: 150, type: "ITEM", category: "Services" },
  ]);
  await prisma.bill.create({
    data: {
      number: "LIN-5521",
      status: "APPROVED",
      source: "EMAIL",
      amount: linearItems.amount,
      tax: linearItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-8),
      dueDate: daysFromNow(15),
      paymentMethod: "ach",
      vendorId: linear.id,
      uploadedById: ana.id,
      approvedById: carla.id,
      lineItems: { create: linearItems.create },
    },
  });

  // Approved infra bill, chosen method = check; no payment yet.
  const awsItems = lineItems(
    [
      { description: "EC2 compute", quantity: 1, unitPrice: 6200.5, type: "EXPENSE", category: "Infrastructure" },
      { description: "S3 storage", quantity: 1, unitPrice: 1430, type: "EXPENSE", category: "Infrastructure" },
      { description: "Data transfer", quantity: 1, unitPrice: 800, type: "EXPENSE", category: "Infrastructure" },
    ],
    0.085
  );
  await prisma.bill.create({
    data: {
      number: "AWS-2042",
      status: "APPROVED",
      source: "CSV",
      amount: awsItems.amount,
      tax: awsItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-6),
      dueDate: daysFromNow(9),
      paymentMethod: "check",
      vendorId: aws.id,
      uploadedById: bruno.id,
      approvedById: carla.id,
      lineItems: { create: awsItems.create },
    },
  });

  // A payment attempt failed. Past due => overdue.
  const slackItems = lineItems([
    { description: "Slack Business+ — 60 seats", quantity: 60, unitPrice: 15, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "SLK-7781",
      status: "FAILED",
      source: "EMAIL",
      amount: slackItems.amount,
      tax: slackItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-20),
      dueDate: daysFromNow(-1), // past due, not paid => overdue
      paymentMethod: "check",
      vendorId: slack.id,
      uploadedById: bruno.id,
      approvedById: carla.id,
      lineItems: { create: slackItems.create },
      payments: {
        create: [
          {
            amount: slackItems.amount,
            status: "FAILED",
            paymentMethodId: check.id,
            processedAt: daysFromNow(-3),
          },
        ],
      },
    },
  });

  // ===== Paid ===========================================================

  // Fully paid; past due date but PAID => never overdue.
  const paidItems = lineItems([
    { description: "Vercel Pro — 10 seats", quantity: 10, unitPrice: 20, type: "EXPENSE", category: "Software" },
    { description: "Extra bandwidth", quantity: 1, unitPrice: 1000, type: "ITEM", category: "Infrastructure" },
  ]);
  await prisma.bill.create({
    data: {
      number: "VER-2041",
      status: "PAID",
      source: "MANUAL",
      amount: paidItems.amount,
      tax: paidItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-30),
      dueDate: daysFromNow(-2),
      paymentMethod: "ach",
      vendorId: vercel.id,
      uploadedById: ana.id,
      approvedById: carla.id,
      lineItems: { create: paidItems.create },
      payments: {
        create: [
          {
            amount: paidItems.amount,
            status: "PAID",
            paymentMethodId: ach.id,
            processedAt: daysFromNow(-3),
          },
        ],
      },
    },
  });

  // Earlier infra invoice, paid by check.
  const awsPaidItems = lineItems([
    { description: "Reserved instances — annual", quantity: 1, unitPrice: 9800, type: "EXPENSE", category: "Infrastructure" },
  ]);
  await prisma.bill.create({
    data: {
      number: "AWS-1998",
      status: "PAID",
      source: "CSV",
      amount: awsPaidItems.amount,
      tax: awsPaidItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-55),
      dueDate: daysFromNow(-25),
      paymentMethod: "check",
      vendorId: aws.id,
      uploadedById: bruno.id,
      approvedById: carla.id,
      lineItems: { create: awsPaidItems.create },
      payments: {
        create: [
          {
            amount: awsPaidItems.amount,
            status: "PAID",
            paymentMethodId: check.id,
            processedAt: daysFromNow(-24),
          },
        ],
      },
    },
  });

  // ===== Extra history so more vendors show paid/owed on the Vendors page ===

  // Figma — an earlier annual, paid by ACH.
  const figmaPaidItems = lineItems(
    [{ description: "Figma Organization — prior term", quantity: 30, unitPrice: 45, type: "EXPENSE", category: "Software" }],
    0.085
  );
  await prisma.bill.create({
    data: {
      number: "FIG-2050",
      status: "PAID",
      source: "OCR",
      amount: figmaPaidItems.amount,
      tax: figmaPaidItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-45),
      dueDate: daysFromNow(-15),
      paymentMethod: "ach",
      vendorId: figma.id,
      uploadedById: bruno.id,
      approvedById: carla.id,
      lineItems: { create: figmaPaidItems.create },
      payments: {
        create: [
          {
            amount: figmaPaidItems.amount,
            status: "PAID",
            paymentMethodId: ach.id,
            processedAt: daysFromNow(-14),
          },
        ],
      },
    },
  });

  // GitHub — last month's seats, paid by ACH.
  const githubPaidItems = lineItems([
    { description: "GitHub Team — 25 seats (prior month)", quantity: 25, unitPrice: 4, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "GH-3400",
      status: "PAID",
      source: "EMAIL",
      amount: githubPaidItems.amount,
      tax: githubPaidItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-38),
      dueDate: daysFromNow(-8),
      paymentMethod: "ach",
      vendorId: github.id,
      uploadedById: ana.id,
      approvedById: carla.id,
      lineItems: { create: githubPaidItems.create },
      payments: {
        create: [
          {
            amount: githubPaidItems.amount,
            status: "PAID",
            paymentMethodId: ach.id,
            processedAt: daysFromNow(-7),
          },
        ],
      },
    },
  });

  // Notion — approved, still owed.
  const notionApprovedItems = lineItems([
    { description: "Notion Business — 30 seats", quantity: 30, unitPrice: 15, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "NOT-2210",
      status: "APPROVED",
      source: "EMAIL",
      amount: notionApprovedItems.amount,
      tax: notionApprovedItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-7),
      dueDate: daysFromNow(14),
      paymentMethod: "ach",
      vendorId: notion.id,
      uploadedById: ana.id,
      approvedById: carla.id,
      lineItems: { create: notionApprovedItems.create },
    },
  });

  // Datadog — approved infra, still owed; paid by check when released.
  const datadogApprovedItems = lineItems(
    [{ description: "Datadog Infra — 40 hosts", quantity: 40, unitPrice: 23, type: "EXPENSE", category: "Infrastructure" }],
    0.085
  );
  await prisma.bill.create({
    data: {
      number: "DD-9001",
      status: "APPROVED",
      source: "OCR",
      amount: datadogApprovedItems.amount,
      tax: datadogApprovedItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-6),
      dueDate: daysFromNow(12),
      paymentMethod: "check",
      vendorId: datadog.id,
      uploadedById: bruno.id,
      approvedById: carla.id,
      lineItems: { create: datadogApprovedItems.create },
    },
  });

  // Attach a generated PDF to every non-MANUAL bill (OCR / EMAIL / CSV) so the
  // document matches the bill's data. MANUAL bills stay without an attachment.
  const docBills = await prisma.bill.findMany({
    where: { source: { not: "MANUAL" } },
    include: {
      vendor: { select: { name: true, email: true } },
      lineItems: { orderBy: { order: "asc" } },
    },
  });
  for (const b of docBills) {
    const pdf = await invoicePdf(b);
    await prisma.bill.update({ where: { id: b.id }, data: { file: pdf } });
  }

  const [bills, payments, methods, vendorCount, userCount] = await Promise.all([
    prisma.bill.count(),
    prisma.payment.count(),
    prisma.paymentMethod.count(),
    prisma.vendor.count(),
    prisma.user.count(),
  ]);
  console.log(
    `Seeded ${bills} bills (${docBills.length} with a generated PDF), ${payments} payments, ${methods} payment methods, ${userCount} users, ${vendorCount} vendors.`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
