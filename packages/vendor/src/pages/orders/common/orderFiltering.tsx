import { HttpTypes } from "@medusajs/types"

const getSymbol = (a: string | Date, symbol: string, b: string | Date) => {
  const dateA = new Date(a)
  const dateB = new Date(b)

  switch (symbol) {
    case "$gte":
      return dateA >= dateB
    case "$lte":
      return dateA <= dateB
    case "$gt":
      return dateA > dateB
    case "$lt":
      return dateA < dateB
    default:
      return dateA.getTime() === dateB.getTime()
  }
}

type SortField = "display_id" | "created_at" | "updated_at"
type SortDirection = "asc" | "desc"

const sortOrders = (
  orders: HttpTypes.AdminOrder[],
  sortField: SortField,
  direction: SortDirection
) => {
  return [...orders].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (sortField === "display_id") {
      return direction === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue)
    }

    // For dates
    const dateA = new Date(aValue as string)
    const dateB = new Date(bValue as string)
    return direction === "asc"
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime()
  })
}

export const filterOrders = (
  orders?: HttpTypes.AdminOrder[],
  filters?: Record<string, Record<string, string | Date>>,
  sort?: string
) => {
  if (!orders || !filters) return orders

  let filteredOrders = orders.filter((order) => {
    return Object.keys(filters).every((key: string) => {
      if (!filters[key]) return true

      const orderValue = order[key as keyof HttpTypes.AdminOrder]

      if (key === "created_at" || key === "updated_at") {
        return Object.entries(filters[key]).every(([operator, value]) => {
          return getSymbol(orderValue as string, operator, value as string)
        })
      }

      return true
    })
  })

  if (sort) {
    const isDescending = sort.startsWith("-")
    const field = isDescending ? sort.slice(1) : sort
    const direction = isDescending ? "desc" : "asc"

    if (["display_id", "created_at", "updated_at"].includes(field)) {
      filteredOrders = sortOrders(
        filteredOrders,
        field as SortField,
        direction as SortDirection
      )
    }
  }

  return filteredOrders
}
