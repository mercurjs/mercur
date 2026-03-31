import { useQueryParams } from "../../use-query-params"

type UseMemberTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useMemberTableQuery = ({
  prefix,
  pageSize = 20,
}: UseMemberTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "order", "created_at", "updated_at"],
    prefix
  )

  const { offset, created_at, updated_at, order } = queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
