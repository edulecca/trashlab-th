import { NextResponse } from "next/server";

import { classify } from "@/lib/ai/classify";
import { extract } from "@/lib/ai/extract";
import type { ExtractResult } from "@/lib/ai/schema";
import { validatePdf } from "@/lib/pdf/validate";

// pdf-lib + AI calls need the Node runtime, and every upload is unique — no caching.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: ExtractResult, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * POST /api/extract — multipart PDF upload -> validated bill draft.
 * Orchestration only: validate -> classify -> (if bill) extract. No DB writes.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return json(
      { ok: false, error: { code: "INVALID_TYPE", message: "No file was uploaded." } },
      400
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Fail fast on invalid input before spending an AI call.
  const invalid = await validatePdf(bytes);
  if (invalid) {
    return json({ ok: false, error: invalid }, 400);
  }

  try {
    const classification = await classify(bytes);
    if (!classification.isBill) {
      return json(
        {
          ok: false,
          error: {
            code: "NOT_A_BILL",
            message: classification.reason || "The document is not an invoice.",
          },
        },
        422
      );
    }

    const data = await extract(bytes);
    return json({ ok: true, data }, 200);
  } catch (err) {
    // Don't leak provider internals to the client.
    console.error("[/api/extract] extraction failed", err);
    return json(
      {
        ok: false,
        error: { code: "EXTRACTION_FAILED", message: "Could not read the invoice. Try again." },
      },
      502
    );
  }
}
