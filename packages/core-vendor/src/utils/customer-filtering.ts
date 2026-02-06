import { AdminCustomer, CustomerFilters } from "../types/customers"

export const filterCustomers = (
  customers: AdminCustomer[] | undefined,
  filters: CustomerFilters
): AdminCustomer[] => {
  if (!customers) return []

  return customers.filter((customer) => {
    // Filter by search query
    if (filters.q) {
      const searchTerm = filters.q.toLowerCase()
      const searchableFields = [
        customer.email,
        customer.first_name,
        customer.last_name,
        customer.phone,
      ].filter(Boolean) as string[]

      const matchesSearch = searchableFields.some((field) =>
        field.toLowerCase().includes(searchTerm)
      )

      if (!matchesSearch) return false
    }

    // Filter by groups
    if (filters.groups?.length) {
      const hasMatchingGroup = customer.groups?.some((group) =>
        filters.groups?.includes(group.id)
      )
      if (!hasMatchingGroup) return false
    }

    // Filter by account status
    if (typeof filters.has_account === "boolean") {
      if (customer.has_account !== filters.has_account) return false
    }

    // Filter by date ranges
    if (filters.created_at) {
      const customerCreatedAt = new Date(customer.created_at || "")
      const filterCreatedAt = new Date(filters.created_at)
      if (customerCreatedAt < filterCreatedAt) return false
    }

    if (filters.updated_at) {
      const customerUpdatedAt = new Date(customer.updated_at || "")
      const filterUpdatedAt = new Date(filters.updated_at)
      if (customerUpdatedAt < filterUpdatedAt) return false
    }

    return true
  })
}

const compareStrings = (
  a: string | null,
  b: string | null,
  desc = false
): number => {
  if (a === null && b === null) return 0
  if (a === null) return desc ? -1 : 1
  if (b === null) return desc ? 1 : -1
  return desc ? b.localeCompare(a) : a.localeCompare(b)
}

const compareDates = (
  dateA: string | Date | null | undefined,
  dateB: string | Date | null | undefined,
  desc = false
): number => {
  const timestampA = dateA ? new Date(dateA).getTime() : 0
  const timestampB = dateB ? new Date(dateB).getTime() : 0
  return desc ? timestampB - timestampA : timestampA - timestampB
}

const compareBooleans = (a: boolean, b: boolean, desc = false): number => {
  if (a === b) return 0
  if (desc) return a ? -1 : 1
  return a ? 1 : -1
}

export const sortCustomers = (
  customers: AdminCustomer[],
  order?: string
): AdminCustomer[] => {
  if (!order) return customers

  const isDesc = order.startsWith("-")
  const field = isDesc ? order.slice(1) : order

  return [...customers].sort((a, b) => {
    switch (field) {
      case "email":
        return compareStrings(a.email, b.email, isDesc)
      case "first_name":
        return compareStrings(a.first_name, b.first_name, isDesc)
      case "last_name":
        return compareStrings(a.last_name, b.last_name, isDesc)
      case "has_account":
        return compareBooleans(a.has_account, b.has_account, isDesc)
      case "created_at":
        return compareDates(a.created_at, b.created_at, isDesc)
      case "updated_at":
        return compareDates(a.updated_at, b.updated_at, isDesc)
      default:
        return 0
    }
  })
}

export const processCustomers = (
  customers: AdminCustomer[] | undefined,
  filters: CustomerFilters
): AdminCustomer[] => {
  if (!customers) return []

  const filteredCustomers = filterCustomers(customers, filters)
  return sortCustomers(filteredCustomers, filters.order)
}
