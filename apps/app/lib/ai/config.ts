/**
 * AI bill-extraction configuration.
 *
 * Two agents with distinct responsibilities: a cheap classifier that filters
 * non-invoices, and an accurate extractor that pulls the structured fields.
 * Model IDs live here so they can be swapped without touching agent logic.
 */

/** Classifier: a cheap yes/no filter — Haiku is fast and low-cost. */
export const CLASSIFIER_MODEL = "claude-haiku-4-5";

/** Extractor: accuracy matters — Opus 4.8. */
export const EXTRACTOR_MODEL = "claude-opus-4-8";

/** Upload limits enforced before any AI call. Product/cost caps, not model limits. */
export const MAX_FILE_BYTES = 500 * 1024; // 500KB
export const MAX_PAGES = 5;
