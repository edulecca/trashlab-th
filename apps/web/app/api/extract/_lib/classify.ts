/**
 * Classifier agent — the cheap filter. Answers: is this PDF a bill/invoice?
 * Runs before extraction so non-invoices short-circuit without paying for the
 * accurate model.
 */
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";

import { classificationSchema, type Classification } from "@/lib/extraction/schema";
import { CLASSIFIER_MODEL } from "./models";
import { CLASSIFIER_SYSTEM } from "./prompts";

export async function classify(pdf: Uint8Array): Promise<Classification> {
  const { output } = await generateText({
    model: anthropic(CLASSIFIER_MODEL),
    output: Output.object({ schema: classificationSchema }),
    system: CLASSIFIER_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Classify the attached document." },
          { type: "file", data: pdf, mediaType: "application/pdf" },
        ],
      },
    ],
  });
  return output;
}
