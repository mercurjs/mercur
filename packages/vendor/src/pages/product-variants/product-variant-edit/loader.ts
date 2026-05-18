import { LoaderFunctionArgs } from "react-router-dom"

import { variantsQueryKeys } from "@hooks/api/products"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

const queryFn = async (id: string, variantId: string) => {
  return await sdk.vendor.products.$id.variants.$variantId.query({
    $id: id,
    $variantId: variantId,
  })
}

const editProductVariantQuery = (id: string, variantId: string) => ({
  queryKey: variantsQueryKeys.detail(variantId),
  queryFn: async () => queryFn(id, variantId),
})

export const editProductVariantLoader = async ({
  params,
  request,
}: LoaderFunctionArgs): Promise<any> => {
  const id = params.product_id || params.id

  const searchParams = new URL(request.url).searchParams
  const searchVariantId = searchParams.get("variant_id")

  const variantId = params.variant_id || searchVariantId

  const query = editProductVariantQuery(id!, variantId || searchVariantId!)

  return (
    queryClient.getQueryData<ReturnType<typeof queryFn>>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
