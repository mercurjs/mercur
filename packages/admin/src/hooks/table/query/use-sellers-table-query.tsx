import { useQueryParams } from "@hooks/use-query-params"

type UseSellersTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useSellersTableQuery = ({
  prefix,
  pageSize = 20,
}: UseSellersTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "created_at", "store_status", "order"],
    prefix
  )

  const { offset, created_at, store_status, q, order } = queryObject

  const searchParams: Record<string, string | number | string[] | undefined> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    store_status: store_status?.split(","),
    q,
    order: order ? order : undefined,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
