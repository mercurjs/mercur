import { LoaderFunctionArgs } from "react-router-dom"

import { variantsQueryKeys } from "@hooks/api/products"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

// Prefix bare fields with `+` so they're additive — otherwise Medusa's
// FieldParser treats them as "replace defaults" and strips title/sku/etc.
// `options` is spelled out rather than requested as `*options` — the 2.16
// options-preview remote joiner rejects bare `*relation` wildcards with
// "Cannot resolve alias path \"\"".
export const VARIANT_DETAIL_FIELDS =
  "+options.id,+options.value,+options.option.id,+options.option.title,+thumbnail,+images.id,+images.url,+images.rank,+images.variants.id,+product.images.id,+product.images.url,+product.images.rank,+product.images.variants.id"

const variantDetailQuery = (productId: string, variantId: string) => ({
  queryKey: variantsQueryKeys.detail(variantId, { fields: VARIANT_DETAIL_FIELDS }),
  queryFn: async () =>
    sdk.vendor.products.$id.variants.$variantId.query({
      $id: productId,
      $variantId: variantId,
      fields: VARIANT_DETAIL_FIELDS,
    }),
})

export const variantLoader = async ({
  params,
}: LoaderFunctionArgs): Promise<any> => {
  const productId = params.id || params.product_id
  const variantId = params.variant_id

  const query = variantDetailQuery(productId!, variantId!)

  return queryClient.ensureQueryData(query)
}
