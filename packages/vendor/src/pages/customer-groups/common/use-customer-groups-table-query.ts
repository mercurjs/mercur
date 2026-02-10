import { useQueryParams } from "@hooks/use-query-params"

export const useCustomerGroupsTableQuery = ({
  pageSize = 10,
}: {
  pageSize?: number
}) => {
  const queryParams = useQueryParams(["q", "order", "offset"])

  const searchParams = {
    q: queryParams.q,
    order: queryParams.order,
    offset: queryParams.offset ? Number(queryParams.offset) : 0,
    limit: pageSize,
  }

  return {
    searchParams,
    raw: queryParams,
  }
}
