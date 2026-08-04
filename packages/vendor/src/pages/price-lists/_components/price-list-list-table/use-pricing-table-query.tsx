import { HttpTypes, PriceListStatus } from "@medusajs/types"
import { useQueryParams } from "@hooks/use-query-params"

export const usePricingTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number
  prefix?: string
}) => {
  const raw = useQueryParams(
    ["offset", "q", "order", "type", "status", "created_at", "updated_at"],
    prefix
  )

  const searchParams: HttpTypes.AdminPriceListListParams & {
    type?: string[]
    created_at?: Record<string, string>
    updated_at?: Record<string, string>
  } = {
    limit: pageSize,
    offset: raw.offset ? Number(raw.offset) : 0,
    order: raw.order,
    type: raw.type?.split(","),
    status: raw.status?.split(",") as PriceListStatus[],
    created_at: raw.created_at ? JSON.parse(raw.created_at) : undefined,
    updated_at: raw.updated_at ? JSON.parse(raw.updated_at) : undefined,
    q: raw.q,
  }

  return {
    searchParams,
    raw,
  }
}
