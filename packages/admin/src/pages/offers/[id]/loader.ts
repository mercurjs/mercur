import { LoaderFunctionArgs } from "react-router-dom"
import { InferClientInput } from "@mercurjs/client"

import { productsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"

/**
 * The admin offer detail is product-shaped (SPEC-010): `:id` is a product
 * id, and the page reads `/admin/products/:id` with offers wrapped under each
 * variant (`variants.offers.*` triggers the wrap). `seller_id` scopes the wrap
 * to a single store, so the detail shows only that store's offers.
 */
export const offerProductDetailQuery = (id: string, sellerId?: string) => ({
  queryKey: productsQueryKeys.detail(id, {
    fields: OFFER_PRODUCT_DETAIL_FIELDS,
    seller_id: sellerId,
  }),
  queryFn: async () =>
    sdk.admin.products.$id.query({
      $id: id,
      fields: OFFER_PRODUCT_DETAIL_FIELDS,
      ...(sellerId ? { seller_id: sellerId } : {}),
    } as InferClientInput<typeof sdk.admin.products.$id.query>),
})

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const id = params.id
  const sellerId =
    new URL(request.url).searchParams.get("seller_id") ?? undefined
  return queryClient.ensureQueryData(offerProductDetailQuery(id!, sellerId))
}
