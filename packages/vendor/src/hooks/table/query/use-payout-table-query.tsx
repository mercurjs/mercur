import { useQueryParams } from "../../use-query-params"

type UsePayoutTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const usePayoutTableQuery = ({
  prefix,
  pageSize = 20,
}: UsePayoutTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "status", "created_at", "updated_at", "order"],
    prefix
  )

  const { offset, status, created_at, updated_at, q, order } = queryObject

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    status: status?.split(","),
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order ? order : "-created_at",
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
