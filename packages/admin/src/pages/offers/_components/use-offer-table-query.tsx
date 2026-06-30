import { useQueryParams } from "../../../hooks/use-query-params"

export const useOfferTableQuery = ({
  pageSize = 10,
  prefix,
}: {
  pageSize?: number
  prefix?: string
}) => {
  const raw = useQueryParams(
    [
      "q",
      "order",
      "offset",
      "created_at",
      "updated_at",
      "category_id",
      "collection_id",
      "type_id",
      "tag_id",
      "status",
      "seller_id",
    ],
    prefix,
  )

  const {
    offset,
    created_at,
    updated_at,
    category_id,
    collection_id,
    type_id,
    tag_id,
    status,
    seller_id,
    order,
    q,
  } = raw

  const searchParams: Record<string, unknown> = {
    limit: pageSize,
    offset: offset ? parseInt(offset, 10) : 0,
    order: order || "-created_at",
    q,
    category_id: category_id ? category_id.split(",") : undefined,
    collection_id: collection_id ? collection_id.split(",") : undefined,
    type_id: type_id ? type_id.split(",") : undefined,
    tag_id: tag_id ? tag_id.split(",") : undefined,
    status: status ? status.split(",") : undefined,
    seller_id: seller_id ? seller_id.split(",") : undefined,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    grouped: "true",
  }

  return {
    searchParams,
    raw,
  }
}
