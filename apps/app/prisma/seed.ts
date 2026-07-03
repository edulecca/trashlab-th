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
  // Catalog of four methods; `card` is created for completeness even though
  // the seeded payments below only exercise ach / check / wire.
  const [ach, check, wire] = await Promise.all(
    [
      { slug: "ach", description: "ACH bank transfer" },
      { slug: "check", description: "Paper check" },
      { slug: "wire", description: "Wire transfer" },
      { slug: "card", description: "Corporate card" },
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

  // --- Bills (one per status) --------------------------------------------

  // DRAFT — just uploaded, not yet reviewed.
  const draftItems = lineItems([
    { description: "Notion Plus — 12 seats", quantity: 12, unitPrice: 8, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "NOT-1090",
      status: "DRAFT",
      source: "MANUAL",
      amount: draftItems.amount,
      tax: draftItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-3),
      dueDate: daysFromNow(25),
      vendorId: notion.id,
      uploadedById: ana.id,
      lineItems: { create: draftItems.create },
    },
  });

  // DRAFT — OCR-ingested, past due => derives as OVERDUE.
  const reviewItems = lineItems(
    [
      { description: "Figma Organization — annual", quantity: 30, unitPrice: 45, type: "EXPENSE", category: "Software" },
    ],
    0.085 // 8.5% sales tax
  );
  await prisma.bill.create({
    data: {
      number: "FIG-2043",
      status: "DRAFT",
      source: "OCR",
      amount: reviewItems.amount,
      tax: reviewItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-40),
      dueDate: daysFromNow(-5), // past due, not paid => overdue
      file: invoicePdfA,
      vendorId: figma.id,
      uploadedById: bruno.id,
      lineItems: { create: reviewItems.create },
    },
  });

  // REVIEWED — reviewed, waiting for approval (no approver yet).
  const reviewedItems = lineItems([
    { description: "Vercel Pro — 8 seats", quantity: 8, unitPrice: 20, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "VER-3088",
      status: "REVIEWED",
      source: "EMAIL",
      amount: reviewedItems.amount,
      tax: reviewedItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-5),
      dueDate: daysFromNow(20),
      file: invoicePdfB,
      vendorId: vercel.id,
      uploadedById: bruno.id,
      lineItems: { create: reviewedItems.create },
    },
  });

  // APPROVED — reviewed and approved, not yet scheduled.
  const approvedItems = lineItems([
    { description: "Linear — 40 seats", quantity: 40, unitPrice: 8, type: "EXPENSE", category: "Software" },
    { description: "Onboarding setup", quantity: 1, unitPrice: 150, type: "ITEM", category: "Services" },
  ]);
  await prisma.bill.create({
    data: {
      number: "LIN-5521",
      status: "APPROVED",
      source: "EMAIL",
      amount: approvedItems.amount,
      tax: approvedItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-8),
      dueDate: daysFromNow(15),
      file: invoicePdfB,
      vendorId: linear.id,
      uploadedById: ana.id,
      approvedById: carla.id,
      lineItems: { create: approvedItems.create },
    },
  });

  // APPROVED — approved and a payment is in flight (PROCESSING).
  const scheduledItems = lineItems(
    [
      { description: "EC2 compute", quantity: 1, unitPrice: 6200.5, type: "EXPENSE", category: "Infrastructure" },
      { description: "S3 storage", quantity: 1, unitPrice: 1430, type: "EXPENSE", category: "Infrastructure" },
      { description: "Data transfer", quantity: 1, unitPrice: 800, type: "EXPENSE", category: "Infrastructure" },
    ],
    0.085 // 8.5% sales tax
  );
  await prisma.bill.create({
    data: {
      number: "AWS-2042",
      status: "APPROVED",
      source: "CSV",
      amount: scheduledItems.amount,
      tax: scheduledItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-6),
      dueDate: daysFromNow(9),
      file: invoicePdfA,
      vendorId: aws.id,
      uploadedById: bruno.id,
      approvedById: carla.id,
      lineItems: { create: scheduledItems.create },
      payments: {
        create: [
          {
            amount: scheduledItems.amount,
            status: "PROCESSING",
            paymentMethodId: wire.id,
            scheduledDate: daysFromNow(1),
          },
        ],
      },
    },
  });

  // PAID — fully paid; past due date but PAID => never overdue.
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
            scheduledDate: daysFromNow(-4),
            processedAt: daysFromNow(-3),
          },
        ],
      },
    },
  });

  // FAILED — first payment failed, then retried (1:N). Past due => overdue.
  const failedItems = lineItems([
    { description: "Slack Business+ — 60 seats", quantity: 60, unitPrice: 15, type: "EXPENSE", category: "Software" },
  ]);
  await prisma.bill.create({
    data: {
      number: "SLK-7781",
      status: "FAILED",
      source: "EMAIL",
      amount: failedItems.amount,
      tax: failedItems.tax,
      currency: "USD",
      invoiceDate: daysFromNow(-20),
      dueDate: daysFromNow(-1), // past due, not paid => overdue
      file: invoicePdfB,
      vendorId: slack.id,
      uploadedById: bruno.id,
      approvedById: carla.id,
      lineItems: { create: failedItems.create },
      payments: {
        create: [
          {
            amount: failedItems.amount,
            status: "FAILED",
            paymentMethodId: ach.id,
            scheduledDate: daysFromNow(-3),
            processedAt: daysFromNow(-3),
          },
          {
            amount: failedItems.amount,
            status: "SCHEDULED",
            paymentMethodId: check.id,
            scheduledDate: daysFromNow(2),
          },
        ],
      },
    },
  });

  const [bills, payments, methods] = await Promise.all([
    prisma.bill.count(),
    prisma.payment.count(),
    prisma.paymentMethod.count(),
  ]);
  console.log(
    `Seeded ${bills} bills, ${payments} payments, ${methods} payment methods, 3 users, 6 vendors.`
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
