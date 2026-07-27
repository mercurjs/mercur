import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { useProductVariant } from "@hooks/api/products"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { VariantGeneralSection } from "./components/variant-general-section"
import { VariantMediaSection } from "./components/variant-media-section"
import { variantLoader, VARIANT_DETAIL_FIELDS } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
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
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={0} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage data={variant} hasOutlet>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <WidgetZone id="product-variants.detail.main" data={variant}>
          <VariantGeneralSection variant={variant} />
          <VariantMediaSection variant={variant} />
        </WidgetZone>
      )}
    </SingleColumnPage>
  )
}

export const ProductVariantDetail = Object.assign(Root, {
  GeneralSection: VariantGeneralSection,
  MediaSection: VariantMediaSection,
})
