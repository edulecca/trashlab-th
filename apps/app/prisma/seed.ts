import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Prisma } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// --- invoice file blobs: sample PDFs shipped as fixtures, embedded as BYTEA.
// No object storage (S3) for the MVP — the bill's file lives in the DB.
const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name));
const invoicePdfA = fixture("sample-invoice.pdf");
const invoicePdfB = fixture("sample-invoice-2.pdf");

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
  const vercel = await prisma.vendor.create({
    data: { name: "Vercel", email: "ap@vercel.com", address: "San Francisco, CA" },
  });
  const aws = await prisma.vendor.create({
    data: { name: "Amazon Web Services", email: "billing@aws.com", address: "Seattle, WA" },
  });
  const figma = await prisma.vendor.create({
    data: { name: "Figma", email: "ap@figma.com", address: "San Francisco, CA" },
  });
  const linear = await prisma.vendor.create({
    data: { name: "Linear", email: "billing@linear.app" },
  });
  const notion = await prisma.vendor.create({
    data: { name: "Notion Labs", email: "ap@notion.so" },
  });
  const slack = await prisma.vendor.create({
    data: { name: "Slack", email: "billing@slack.com", address: "San Francisco, CA" },
  });
  const github = await prisma.vendor.create({
    data: { name: "GitHub", email: "billing@github.com", address: "San Francisco, CA" },
  });
  const datadog = await prisma.vendor.create({
    data: { name: "Datadog", email: "ap@datadoghq.com", address: "New York, NY" },
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
      file: invoicePdfA,
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
      file: invoicePdfB,
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
      file: invoicePdfA,
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
      file: invoicePdfB,
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
      file: invoicePdfA,
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
      file: invoicePdfB,
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
      file: invoicePdfA,
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

  const [bills, payments, methods, vendorCount, userCount] = await Promise.all([
    prisma.bill.count(),
    prisma.payment.count(),
    prisma.paymentMethod.count(),
    prisma.vendor.count(),
    prisma.user.count(),
  ]);
  console.log(
    `Seeded ${bills} bills, ${payments} payments, ${methods} payment methods, ${userCount} users, ${vendorCount} vendors.`
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
