/**
 * Extractor agent — the accurate worker. Pulls structured invoice fields from a
 * PDF already classified as a bill. Output is validated against extractionSchema.
 */
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";

import { EXTRACTOR_MODEL } from "./config";
import { EXTRACTOR_SYSTEM } from "./prompts";
import { extractionSchema, type ExtractionData } from "./schema";

export async function extract(pdf: Uint8Array): Promise<ExtractionData> {
  const { output } = await generateText({
    model: anthropic(EXTRACTOR_MODEL),
    output: Output.object({ schema: extractionSchema }),
    system: EXTRACTOR_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the invoice data from the attached PDF." },
          { type: "file", data: pdf, mediaType: "application/pdf" },
        ],
      },
    ],
  });
  return output;
}
