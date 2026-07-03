/**
 * Upload limits for the bill-extraction pipeline — enforced before any AI call.
 * Shared contract: both the API's PDF validator and `saveDraft` cap uploads by
 * these. Product/cost caps, not model limits.
 */
export const MAX_FILE_BYTES = 500 * 1024; // 500KB
export const MAX_PAGES = 5;
