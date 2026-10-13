import { useQueryParams } from "../../../hooks/use-query-params"

type UseReturnRequestTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useReturnRequestTableQuery = ({
  prefix,
  pageSize = 20,
}: UseReturnRequestTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "order",
      "created_at",
      "updated_at",
      "status",
      "seller_id",
      "customer_id",
      "order_id",
    ],
    prefix
  )

  const {
    offset,
    order,
    created_at,
    updated_at,
    status,
    seller_id,
    customer_id,
    order_id,
  } = queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order ? order : "-created_at",
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    status: status ? status.split(",") : undefined,
    seller_id: seller_id ? seller_id.split(",") : undefined,
    customer_id: customer_id ? customer_id.split(",") : undefined,
    order_id: order_id ? order_id.split(",") : undefined,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
