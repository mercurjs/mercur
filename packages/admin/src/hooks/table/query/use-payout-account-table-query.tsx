import { useQueryParams } from "../../use-query-params"

type UsePayoutAccountTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const usePayoutAccountTableQuery = ({
  prefix,
  pageSize = 20,
}: UsePayoutAccountTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "order",
      "status",
      "kyc_status",
      "seller_id",
      "created_at",
      "updated_at",
    ],
    prefix,
  )

  const { offset, q, order, status, kyc_status, seller_id, created_at, updated_at } =
    queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order ?? "-created_at",
    status: status?.split(","),
    kyc_status: kyc_status?.split(","),
    seller_id: seller_id?.split(","),
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    ...(q ? { q } : {}),
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
