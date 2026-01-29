import { HttpTypes, PriceListStatus } from "@medusajs/types"
import { useQueryParams } from "../../../../../hooks/use-query-params"

export const usePricingTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number
  prefix?: string
}) => {
  const raw = useQueryParams(
    ["offset", "q", "order", "status", "starts_at", "ends_at"],
    prefix
  )

  const searchParams: HttpTypes.AdminPriceListListParams = {
    limit: pageSize,
    offset: raw.offset ? Number(raw.offset) : 0,
    order: raw.order,
    status: raw.status?.split(",") as PriceListStatus[],
    starts_at: raw.starts_at ? JSON.parse(raw.starts_at) : undefined,
    ends_at: raw.ends_at ? JSON.parse(raw.ends_at) : undefined,
    q: raw.q,
  }

  return {
    searchParams,
    raw,
  }
}
