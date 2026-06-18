import { HttpTypes } from "@medusajs/types"

export const DEFAULT_CUSTOMER_GROUP_ORDER = "name"

type CustomerGroupQuery = {
  q?: string
  order?: string
}

/**
 * The customer detail "Customer Groups" section renders the groups embedded on
 * the customer (`customer.groups`) rather than a paginated server query, so the
 * search box (MER-207) and order dropdown (MER-205) have to be applied on the
 * client. This keeps that logic pure and unit-testable.
 */
export const filterAndSortCustomerGroups = (
  groups: HttpTypes.AdminCustomerGroup[],
  { q, order }: CustomerGroupQuery = {}
): HttpTypes.AdminCustomerGroup[] => {
  const query = q?.trim().toLowerCase()

  const filtered = query
    ? groups.filter((group) => (group.name ?? "").toLowerCase().includes(query))
    : [...groups]

  const orderBy = order || DEFAULT_CUSTOMER_GROUP_ORDER
  const descending = orderBy.startsWith("-")
  const key = descending ? orderBy.slice(1) : orderBy

  filtered.sort((a, b) => {
    const left = (a as Record<string, unknown>)[key]
    const right = (b as Record<string, unknown>)[key]

    const leftValue = left == null ? "" : String(left)
    const rightValue = right == null ? "" : String(right)

    const comparison = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: "base",
    })

    return descending ? -comparison : comparison
  })

  return filtered
}
