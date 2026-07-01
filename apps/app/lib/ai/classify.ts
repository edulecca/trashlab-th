/**
 * Classifier agent — the cheap filter. Answers: is this PDF a bill/invoice?
 * Runs before extraction so non-invoices short-circuit without paying for the
 * accurate model.
 */
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";

import { CLASSIFIER_MODEL } from "./config";
import { CLASSIFIER_SYSTEM } from "./prompts";
import { classificationSchema, type Classification } from "./schema";

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
