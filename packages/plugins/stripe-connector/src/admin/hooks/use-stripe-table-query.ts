import { useQueryParams } from "@mercurjs/dashboard-shared"

import type { ListQuery } from "../lib/client"

export const PAGE_SIZE = 20

type UseStripeTableQueryProps = {
  filters?: string[]
  dateFilters?: string[]
  pageSize?: number
}

export const useStripeTableQuery = ({
  filters = [],
  dateFilters = [],
  pageSize = PAGE_SIZE,
}: UseStripeTableQueryProps = {}) => {
  const raw = useQueryParams(["offset", ...filters, ...dateFilters])

  const searchParams: ListQuery = {
    limit: pageSize,
    offset: raw.offset ? Number(raw.offset) : 0,
  }

  // The client serializes `undefined` as a literal string, so only set what is present.
  for (const key of filters) {
    const value = raw[key]
    if (value) {
      searchParams[key] = value.split(",")
    }
  }

  for (const key of dateFilters) {
    const value = raw[key]
    if (value) {
      searchParams[key] = JSON.parse(value)
    }
  }

  return { searchParams, raw }
}
