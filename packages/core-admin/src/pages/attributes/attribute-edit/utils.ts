interface PossibleValue {
  value?: string;
}

export function findDuplicatePossibleValues(
  possibleValues: PossibleValue[]
): string[] {
  if (!possibleValues?.length) return [];

  const seen = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const { value } of possibleValues) {
    const original = value?.trim();
    if (!original) continue;

    const normalized = original.toLowerCase();
    const first = seen.get(normalized);
    
    if (first) {
      duplicates.add(first);
    } else {
      seen.set(normalized, original);
    }
  }

  return Array.from(duplicates);
}

