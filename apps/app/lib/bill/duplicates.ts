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
    const ordered = [...group].sort(
      (a, b) => a.uploadedAt.localeCompare(b.uploadedAt) || a.id.localeCompare(b.id)
    );
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
 * The invoice number of the earliest bill matching `number` + `vendor` in
 * `rows`, excluding `excludeId`. Used by the create screen's duplicate banner.
 */
export function findDuplicateNumber(
  rows: BillRow[],
  target: { number: string; vendor: string; excludeId?: string }
): string | null {
  if (!qualifies(target.number)) return null;
  const key = keyOf(target.number, target.vendor);
  const matches = rows
    .filter((r) => r.id !== target.excludeId && qualifies(r.number))
    .filter((r) => keyOf(r.number, r.vendor) === key)
    .sort(
      (a, b) => a.uploadedAt.localeCompare(b.uploadedAt) || a.id.localeCompare(b.id)
    );
  return matches.length > 0 ? matches[0].number : null;
}
