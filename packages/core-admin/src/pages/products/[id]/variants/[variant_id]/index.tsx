import { useLoaderData, useParams } from "react-router-dom"

import { useProductVariant } from "@hooks/api/products"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { VariantGeneralSection } from "./_components/variant-general-section"
import {
  InventorySectionPlaceholder,
  VariantInventorySection,
} from "./_components/variant-inventory-section"
import { VariantPricesSection } from "./_components/variant-prices-section"
import { VARIANT_DETAIL_FIELDS } from "./_common/constants"
import { variantLoader } from "./loader"

const ProductVariantDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof variantLoader>
  >

  const { id, variant_id } = useParams()
  const { variant, isLoading, isError, error } = useProductVariant(
    id!,
    variant_id!,
    { fields: VARIANT_DETAIL_FIELDS },
    {
      initialData,
    }
  )

  const { getWidgets } = useExtension()

  if (isLoading || !variant) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      data={variant}
      hasOutlet
      showJSON
      showMetadata
      widgets={{
        after: getWidgets("product_variant.details.after"),
        before: getWidgets("product_variant.details.before"),
        sideAfter: getWidgets("product_variant.details.side.after"),
        sideBefore: getWidgets("product_variant.details.side.before"),
      }}
    >
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={variant} />
        {!variant.manage_inventory ? (
          <InventorySectionPlaceholder />
        ) : (
          <VariantInventorySection
            inventoryItems={variant.inventory_items?.map((i) => {
              return {
                ...i.inventory,
                required_quantity: i.required_quantity,
                variant,
              }
            }) ?? []}
          />
        )}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <VariantPricesSection variant={variant} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const Component = ProductVariantDetail
export { variantLoader as loader } from "./loader"
export { ProductVariantDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
