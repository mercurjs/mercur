import { HttpTypes } from "@medusajs/types"
import { LoaderFunctionArgs, defer } from "react-router-dom"

import { sdk } from "@lib/client"
import { PRODUCT_VARIANT_IDS_KEY } from "@pages/products/common/constants"

import { ProductStockModal } from "./_components/product-stock-modal"

// Loader
async function getProductStockData(id: string, productVariantIds?: string[]) {
  const CHUNK_SIZE = 20
  let offset = 0
  let totalCount = 0

  let allVariants: HttpTypes.AdminProductVariant[] = []

  do {
    const { variants: chunk, count } = await sdk.admin.product.listVariants(
      id,
      {
        id: productVariantIds,
        offset,
        limit: CHUNK_SIZE,
        fields:
          "id,title,sku,inventory_items,inventory_items.*,inventory_items.inventory,inventory_items.inventory.id,inventory_items.inventory.title,inventory_items.inventory.sku,*inventory_items.inventory.location_levels,product.thumbnail",
      }
    )

    allVariants = [...allVariants, ...chunk]
    totalCount = count
    offset += CHUNK_SIZE
  } while (allVariants.length < totalCount)

  const { stock_locations } = await sdk.admin.stockLocation.list({
    limit: 9999,
    fields: "id,name",
  })

  return {
    variants: allVariants,
    locations: stock_locations,
  }
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const id = params.id!
  const searchParams = new URLSearchParams(request.url)
  const productVariantIds =
    searchParams.get(PRODUCT_VARIANT_IDS_KEY)?.split(",") || undefined

  const dataPromise = getProductStockData(id, productVariantIds)

  return defer({
    data: dataPromise,
  })
}

// Re-export compound component for user overrides
export { ProductStockModal }
export type { ProductStockModalProps } from "./_components/product-stock-modal"
export type { ProductStockContextValue } from "./_components/product-stock-context"

export const Component = () => (
  <ProductStockModal>
    <ProductStockModal.Title />
    <ProductStockModal.Content />
  </ProductStockModal>
)
