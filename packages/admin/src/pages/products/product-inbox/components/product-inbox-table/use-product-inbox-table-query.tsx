import { useQueryParams } from "../../../../../hooks/use-query-params"

export const useProductInboxTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number
  prefix?: string
}) => {
  const raw = useQueryParams(
    ["q", "order", "offset", "type", "seller_id", "created_at", "updated_at"],
    prefix,
  )

  const { offset, order, q, type, seller_id, created_at, updated_at } = raw

  const searchParams: Record<string, unknown> = {
    limit: pageSize,
    offset: offset ? parseInt(offset, 10) : 0,
    order: order || "-created_at",
    ...(q ? { q } : {}),
    type: type ? type.split(",") : undefined,
    seller_id: seller_id ? seller_id.split(",") : undefined,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
  }

  return { searchParams, raw }
}
