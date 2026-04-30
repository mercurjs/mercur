import { useParams } from "react-router-dom"

import { useProduct } from "@hooks/api/products"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { VariantGeneralSection } from "./components/variant-general-section"
import {
  InventorySectionPlaceholder,
  VariantInventorySection,
} from "./components/variant-inventory-section"
import { VariantPricesSection } from "./components/variant-prices-section"

export const ProductVariantDetail = () => {
  const { product_id, variant_id } = useParams()
  const {
    product,
    isLoading,
    isError,
    error,
  } = useProduct(product_id!, {
    fields: "*variants.inventory_items",
  })

  const productVariant = product?.variants?.find(
    (item) => item.id === variant_id
  )

  if (isLoading || !productVariant) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage data={productVariant} hasOutlet>
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={productVariant} />
        {!productVariant.manage_inventory ? (
          <InventorySectionPlaceholder />
        ) : (
          productVariant.inventory_items && (
            <VariantInventorySection
              inventoryItems={productVariant.inventory_items.map((i) => {
                return {
                  id: i.inventory_item_id,
                  required_quantity: i.required_quantity,
                  variant: productVariant,
                }
              })}
            />
          )
        )}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <VariantPricesSection variant={productVariant} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
