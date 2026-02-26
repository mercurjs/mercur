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
    ["offset", "q", "order", "created_at", "updated_at", "status"],
    prefix,
  )

  const { offset, q, order, created_at, updated_at, status } = queryObject

  const searchParams: Record<string, string | number | string[] | undefined> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    q,
    order: order ?? "-created_at",
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    status: status?.split(","),
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
