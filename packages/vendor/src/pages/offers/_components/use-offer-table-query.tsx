import { InferClientInput } from "@mercurjs/client"

import { sdk } from "../../../lib/client"
import { useQueryParams } from "../../../hooks/use-query-params"
import { OFFER_PRODUCT_LIST_FIELDS } from "../common/constants"

type ProductQuery = InferClientInput<typeof sdk.vendor.products.query>

/**
 * Query parsing for the product-backed Offers list. Mirrors
 * `useProductTableQuery` (the offers list now reads `/vendor/products`),
 * but pins `has_offer: "true"` to scope to the seller's offered products
 * and requests `OFFER_PRODUCT_LIST_FIELDS` so the `withOffers` wrap fires.
 */
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
      "id",
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
    order,
    q,
  } = raw

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order || "title",
    q,
    category_id: category_id ? category_id.split(",") : undefined,
    collection_id: collection_id ? collection_id.split(",") : undefined,
    type_id: type_id ? type_id.split(",") : undefined,
    tag_id: tag_id ? tag_id.split(",") : undefined,
    status: status ? status.split(",") : undefined,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    has_offer: "true",
    fields: OFFER_PRODUCT_LIST_FIELDS,
  } as ProductQuery

  return {
    searchParams,
    raw,
  }
}
