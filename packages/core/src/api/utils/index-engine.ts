import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export type IndexedShape = { [key: string]: true | IndexedShape }

export const LOGICAL_OPERATORS = ["$and", "$or", "$not"]

export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Date)

// The index rejects any key outside its schema, so filters are checked against
// the indexed shape before the engine is chosen.
export const isIndexable = (
  filters: Record<string, unknown>,
  shape: IndexedShape
): boolean =>
  Object.entries(filters).every(([key, value]) => {
    if (value === undefined) {
      return true
    }

    if (LOGICAL_OPERATORS.includes(key)) {
      const entries = Array.isArray(value) ? value : [value]
      return entries.every(
        (entry) => isPlainObject(entry) && isIndexable(entry, shape)
      )
    }

    const node = shape[key]
    if (!node) {
      return false
    }
    if (node === true) {
      return true
    }

    return isPlainObject(value) && isIndexable(value, node)
  })

export const isOrderIndexable = (
  order: Record<string, unknown> | undefined,
  shape: IndexedShape
) =>
  !order ||
  Object.keys(order).every((path) => {
    let node: true | IndexedShape | undefined = shape
    for (const segment of path.split(".")) {
      if (!node || node === true) {
        return false
      }
      node = node[segment]
    }
    return node === true
  })

// Checked through the container, not FeatureFlag: core and the host can load
// separate @medusajs/framework copies with separate flag routers.
export const isIndexEngineEnabled = (scope: MedusaContainer) =>
  !!scope.resolve(Modules.INDEX, { allowUnregistered: true })

export const withClause = (
  filters: Record<string, unknown>,
  clause: Record<string, unknown> | undefined
) => {
  if (!clause) {
    return filters
  }
  const existing = Array.isArray(filters.$and) ? filters.$and : []
  return { ...filters, $and: [...existing, clause] }
}

// The index only reports the planner's estimate; a page that isn't full pins
// the count exactly, as Medusa's store product list does.
export const reconcileCount = (
  estimate: number,
  skip: number,
  take: number | undefined,
  returned: number
) => {
  if (take === undefined || returned < take) {
    return skip + returned
  }
  return Math.max(estimate, skip + returned + 1)
}
