/**
 * PDF upload validation — runs before any AI call so invalid files fail fast
 * and cheaply. Enforces: real PDF (magic bytes), size, page count, not encrypted.
 */
import { PDFDocument } from "pdf-lib";

import { MAX_FILE_BYTES, MAX_PAGES } from "@/lib/ai/config";
import type { ExtractError } from "@/lib/ai/schema";

const PDF_MAGIC = "%PDF-";

/** Returns an ExtractError if the file is invalid, or null if it passes. */
export async function validatePdf(bytes: Uint8Array): Promise<ExtractError | null> {
  // 1. Real PDF? Check the leading magic bytes, not the file extension.
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, 5));
  if (header !== PDF_MAGIC) {
    return { code: "INVALID_TYPE", message: "The file is not a PDF." };
  }

  // 2. Size cap.
  if (bytes.byteLength > MAX_FILE_BYTES) {
    return {
      code: "TOO_LARGE",
      message: `The PDF is larger than ${Math.round(MAX_FILE_BYTES / 1024)}KB.`,
    };
  }

  // 3. Parse to count pages and detect encryption. pdf-lib throws on encrypted
  //    documents unless ignoreEncryption is set — we use that to reject them.
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    return { code: "INVALID_TYPE", message: "The PDF could not be parsed." };
  }

  if (doc.isEncrypted) {
    return {
      code: "ENCRYPTED",
      message: "The PDF is password-protected. Remove the protection and retry.",
    };
  }

  if (doc.getPageCount() > MAX_PAGES) {
    return {
      code: "TOO_MANY_PAGES",
      message: `The PDF has more than ${MAX_PAGES} pages.`,
    };
  }

  return null;
}
