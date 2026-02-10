import { CustomerGroupData } from "@pages/orders/common/customerGroupFiltering"

export const customerGroupFilter = (
  groups: CustomerGroupData[],
  sortOrder?: string,
  searchQuery?: string
): CustomerGroupData[] => {
  let filtered = groups

  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter((group) => {
      const name = group.customer_group?.name?.toLowerCase() || ""
      return name.includes(searchQuery.toLowerCase())
    })
  }

  // Sort by order
  if (sortOrder) {
    const isDescending = sortOrder.startsWith("-")
    const field = isDescending ? sortOrder.slice(1) : sortOrder
    const direction = isDescending ? -1 : 1

    filtered = [...filtered].sort((a, b) => {
      const aValue = a.customer_group?.[field as keyof typeof a.customer_group]
      const bValue = b.customer_group?.[field as keyof typeof b.customer_group]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction * aValue.localeCompare(bValue)
      }

      return 0
    })
  }

  return filtered
}
