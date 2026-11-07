export type CorrectionSnapshot = Record<string, string | number | boolean | null>;

const snapshotValue = (value: unknown): string | number | boolean | null => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return value == null ? null : String(value);
};

export const getCorrectionDiff = (
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
  fields: readonly string[]
): { before: CorrectionSnapshot; after: CorrectionSnapshot } | null => {
  const before: CorrectionSnapshot = {};
  const after: CorrectionSnapshot = {};

  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(proposed, field)) continue;
    const oldValue = snapshotValue(current[field]);
    const newValue = snapshotValue(proposed[field]);
    if (oldValue === newValue) continue;
    before[field] = oldValue;
    after[field] = newValue;
  }

  return Object.keys(before).length ? { before, after } : null;
};
