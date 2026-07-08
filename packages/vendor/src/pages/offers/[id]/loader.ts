import { LoaderFunctionArgs } from "react-router-dom"
import { getLinkQuery } from "@mercurjs/dashboard-shared"

import { productsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"

/**
 * The offer detail is product-shaped (SPEC-009): `:id` is a product id,
 * and the page reads `/vendor/products/:id` with the seller's offers
 * wrapped under each variant (`variants.offers.*` triggers the wrap).
 */
const offerProductDetailQuery = (id: string) => {
  const query = getLinkQuery("offer", OFFER_PRODUCT_DETAIL_FIELDS)
  return {
    queryKey: productsQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.vendor.products.$id.query({
        $id: id,
        ...query,
      }),
  }
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  return queryClient.ensureQueryData(offerProductDetailQuery(id!))
}
