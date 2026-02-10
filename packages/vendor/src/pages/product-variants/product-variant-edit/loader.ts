import { LoaderFunctionArgs } from "react-router-dom"

import { productVariantQueryKeys } from "@hooks/api"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"

const queryFn = async (id: string, variantId: string) => {
  const { product } = await fetchQuery(`/vendor/products/${id}`, {
    method: "GET",
    query: { fields: "*variants" },
  })

  const variant = product.variants.find(
    ({ id }: { id: string }) => id === variantId
  )

  return { variant }
}

const editProductVariantQuery = (id: string, variantId: string) => ({
  queryKey: productVariantQueryKeys.detail(variantId),
  queryFn: async () => queryFn(id, variantId),
})

export const editProductVariantLoader = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  const id = params.product_id

  const searchParams = new URL(request.url).searchParams
  const searchVariantId = searchParams.get("variant_id")

  const variantId = params.variant_id || searchVariantId

  const query = editProductVariantQuery(id!, variantId || searchVariantId!)

  return (
    queryClient.getQueryData<ReturnType<typeof queryFn>>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
