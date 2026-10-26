import { useQueryParams } from "../../use-query-params"

type UseTransferTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useTransferTableQuery = ({
  prefix,
  pageSize = 20,
}: UseTransferTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "order",
      "status",
      "type",
      "account_id",
      "created_at",
      "updated_at",
    ],
    prefix,
  )

  const { offset, q, order, status, type, account_id, created_at, updated_at } =
    queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order ?? "-created_at",
    status: status?.split(","),
    type: type?.split(","),
    account_id: account_id?.split(","),
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    ...(q ? { q } : {}),
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
