import type { BillRow } from "./row";

/**
 * Duplicate detection — a pure UI derivation over bills already loaded in the
 * client. Two bills are duplicates when they share the same (real) invoice
 * number and vendor; the earliest by upload time is the original, the rest are
 * flagged. Nothing is persisted or queried.
 */

/** A number only counts for dedup if it's a real invoice number. */
function qualifies(number: string): boolean {
  const n = number.trim();
  return n !== "" && n.toUpperCase() !== "DRAFT";
}

const keyOf = (number: string, vendor: string) =>
  `${number.trim().toLowerCase()}::${vendor.trim().toLowerCase()}`;

/** Chronological order (ties broken by id) — the earliest is the original. */
const byUpload = (a: BillRow, b: BillRow) =>
  a.uploadedAt.localeCompare(b.uploadedAt) || a.id.localeCompare(b.id);

/**
 * Return a copy of `rows` with `duplicateOf` set: for each group sharing a
 * qualifying number + vendor, the earliest `uploadedAt` (ties by id) is the
 * original (null); every later one points at the original's number.
 */
export function annotateDuplicates(rows: BillRow[]): BillRow[] {
  const groups = new Map<string, BillRow[]>();
  for (const row of rows) {
    if (!qualifies(row.number)) continue;
    const key = keyOf(row.number, row.vendor);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const duplicateOf = new Map<string, string>(); // row.id -> original number
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ordered = [...group].sort(byUpload);
    const original = ordered[0];
    for (const row of ordered.slice(1)) {
      duplicateOf.set(row.id, original.number);
    }
  }

  return rows.map((row) =>
    duplicateOf.has(row.id)
      ? { ...row, duplicateOf: duplicateOf.get(row.id)! }
      : row
  );
}

/**
 * The original bill the current draft duplicates, or null. A draft is a
 * duplicate only when an *earlier* bill shares its number + vendor — so the
 * first-created bill (the original) is never flagged, even once later
 * duplicates exist. `excludeId` is the draft's own id (found in `rows` when
 * it's persisted, so we can tell whether it's the earliest). Used by the create
 * screen's duplicate banner, which links to the original.
 */
export function findDuplicate(
  rows: BillRow[],
  target: { number: string; vendor: string; excludeId?: string }
): BillRow | null {
  if (!qualifies(target.number)) return null;
  const key = keyOf(target.number, target.vendor);
  const matches = rows
    .filter((r) => r.id !== target.excludeId && qualifies(r.number))
    .filter((r) => keyOf(r.number, r.vendor) === key)
    .sort(byUpload);
  if (matches.length === 0) return null;

  const original = matches[0];

  // If the draft itself is older than the earliest other match, it's the
  // group's original — don't flag it. (A brand-new draft isn't in `rows`, so
  // `self` is undefined and any existing match makes it a duplicate.)
  const self = target.excludeId
    ? rows.find((r) => r.id === target.excludeId)
    : undefined;
  if (self && byUpload(self, original) < 0) return null;

  return original;
}
