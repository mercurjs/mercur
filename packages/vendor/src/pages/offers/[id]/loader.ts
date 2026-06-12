import { LoaderFunctionArgs } from "react-router-dom"

import { productsQueryKeys } from "../../../hooks/api/products"
import { fetchQuery } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"

/**
 * The offer detail is product-shaped (SPEC-009): `:id` is a product id,
 * and the page reads `/vendor/products/:id` with the seller's offers
 * wrapped under each variant (`variants.offers.*` triggers the wrap).
 */
const offerProductDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, {
    fields: OFFER_PRODUCT_DETAIL_FIELDS,
  }),
  queryFn: async () =>
    fetchQuery(`/vendor/products/${id}`, {
      method: "GET",
      query: { fields: OFFER_PRODUCT_DETAIL_FIELDS },
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  return queryClient.ensureQueryData(offerProductDetailQuery(id!))
}
