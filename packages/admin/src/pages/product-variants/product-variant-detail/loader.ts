import { LoaderFunctionArgs } from "react-router-dom"

import { variantsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const variantDetailQuery = (productId: string, variantId: string) => ({
  queryKey: variantsQueryKeys.detail(variantId),
  queryFn: async () =>
    sdk.admin.products.$id.variants.$variantId.query({
      $id: productId,
      $variantId: variantId,
    }),
})

export const variantLoader = async ({ params }: LoaderFunctionArgs): Promise<any> => {
  const productId = params.id
  const variantId = params.variant_id

  const query = variantDetailQuery(productId!, variantId!)

  return queryClient.ensureQueryData(query)
}
