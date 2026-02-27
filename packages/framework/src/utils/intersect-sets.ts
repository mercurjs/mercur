/**
 * Computes the intersection of multiple sets.
 * Returns a new set containing only elements present in ALL input sets.
 * Returns an empty set if the input array is empty.
 */
export const intersectSets = <T>(sets: Set<T>[]): Set<T> => {
  if (sets.length === 0) return new Set()
  return sets.reduce((acc, set) => new Set([...acc].filter((x) => set.has(x))))
}

