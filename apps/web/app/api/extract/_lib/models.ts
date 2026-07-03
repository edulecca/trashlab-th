/**
 * Model IDs for the two extraction agents — route-owned, so they can be swapped
 * without touching agent logic. A cheap classifier filters non-invoices; an
 * accurate extractor pulls the structured fields.
 */

/** Classifier: a cheap yes/no filter — Haiku is fast and low-cost. */
export const CLASSIFIER_MODEL = "claude-haiku-4-5";

/** Extractor: accuracy matters — Opus 4.8. */
export const EXTRACTOR_MODEL = "claude-opus-4-8";
