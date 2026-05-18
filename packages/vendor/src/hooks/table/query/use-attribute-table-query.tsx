import { useQueryParams } from "../../use-query-params"

type UseAttributeTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useAttributeTableQuery = ({
  prefix,
  pageSize = 20,
}: UseAttributeTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "order", "created_at", "updated_at", "is_filterable"],
    prefix
  )

  const { offset, q, order, created_at, updated_at, is_filterable } =
    queryObject

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    is_filterable:
      is_filterable !== undefined ? is_filterable === "true" : undefined,
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
