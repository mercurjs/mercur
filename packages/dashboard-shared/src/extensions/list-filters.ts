import type { CustomListFilter } from "@mercurjs/dashboard-sdk"

type Keyed = { key: string }

const isRemoval = (filter: CustomListFilter): filter is { key: string; remove: true } =>
  "remove" in filter && filter.remove === true

/**
 * Applies a custom-fields `list.filters` block to a table's built-in filters.
 * An entry whose `key` matches a built-in filter replaces it in place, an
 * entry with `remove: true` drops it, and any other key is appended.
 */
export function mergeListFilters<TFilter extends Keyed>(
  base: TFilter[],
  extensions: readonly CustomListFilter[]
): TFilter[] {
  if (!extensions.length) {
    return base
  }

  const byKey = new Map(extensions.map((f) => [f.key, f]))
  const merged: TFilter[] = []

  for (const filter of base) {
    const override = byKey.get(filter.key)
    if (!override) {
      merged.push(filter)
    } else if (!isRemoval(override)) {
      merged.push(override as unknown as TFilter)
    }
  }

  const baseKeys = new Set(base.map((f) => f.key))
  for (const filter of extensions) {
    if (!baseKeys.has(filter.key) && !isRemoval(filter)) {
      merged.push(filter as unknown as TFilter)
    }
  }

  return merged
}
