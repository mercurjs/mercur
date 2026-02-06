import { LoaderFunctionArgs } from "react-router-dom"

import { variantsQueryKeys } from "@hooks/api/products"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { VARIANT_DETAIL_FIELDS } from "./constants"

const variantDetailQuery = (productId: string, variantId: string) => ({
  queryKey: variantsQueryKeys.detail(variantId, {
    fields: VARIANT_DETAIL_FIELDS,
  }),
  queryFn: async () =>
    await fetchQuery(`/vendor/products/${productId}`, {
      method: "GET",
      // query: { fields: VARIANT_DETAIL_FIELDS },
    }),
})

export const variantLoader = async ({ params }: LoaderFunctionArgs) => {
  const productId = params.product_id
  const variantId = params.variant_id

  const query = variantDetailQuery(productId!, variantId!)

  return queryClient.ensureQueryData(query)
}
