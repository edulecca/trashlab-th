import { prisma } from "@/lib/prisma";

// Prisma + always-fresh reads.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/bills/[id]/file — the bill's stored source PDF, inline.
 * 404 when the bill has no file or the id is unknown.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bill = await prisma.bill.findUnique({
    where: { id },
    select: { file: true },
  });

  if (!bill?.file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(bill.file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}
