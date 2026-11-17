import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import { LayoutComposer } from "@mercurjs/dashboard-shared"

import { useProductVariant } from "@hooks/api/products"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { VariantAttributeSection } from "./components/variant-attribute-section"
import { VariantGeneralSection } from "./components/variant-general-section"
import { VariantMediaSection } from "./components/variant-media-section"
import { variantLoader, VARIANT_DETAIL_FIELDS } from "./loader"

export const ProductVariantDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof variantLoader>
  >

  const { id, product_id, variant_id } = useParams()
  const productId = id || product_id
  const { variant, isLoading, isError, error } = useProductVariant(
    productId!,
    variant_id!,
    { fields: VARIANT_DETAIL_FIELDS },
    {
      initialData,
    }
  )

  if (isLoading || !variant) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={0} />
  }

  if (isError) {
    throw error
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="product-variants.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={variant}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="VariantGeneralSection">
              <VariantGeneralSection variant={variant} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="VariantMediaSection">
              <VariantMediaSection variant={variant} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="VariantAttributeSection">
              <VariantAttributeSection
                variant={variant}
                productId={productId!}
              />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}
