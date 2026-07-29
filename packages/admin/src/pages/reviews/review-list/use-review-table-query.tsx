import { useQueryParams } from "../../../hooks/use-query-params"

type UseReviewTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useReviewTableQuery = ({
  prefix,
  pageSize = 20,
}: UseReviewTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "order",
      "created_at",
      "updated_at",
      "rating",
      "status",
      "seller_id",
      "customer_id",
    ],
    prefix
  )

  const {
    offset,
    q,
    order,
    created_at,
    updated_at,
    rating,
    status,
    seller_id,
    customer_id,
  } = queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order ? order : "-created_at",
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    rating: rating ? rating.split(",").map(Number) : undefined,
    status: status ? status.split(",") : undefined,
    seller_id: seller_id ? seller_id.split(",") : undefined,
    customer_id: customer_id ? customer_id.split(",") : undefined,
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
