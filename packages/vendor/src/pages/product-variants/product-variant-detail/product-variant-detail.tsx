import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

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

  const { product_id, variant_id } = useParams()
  const { variant, isLoading, isError, error } = useProductVariant(
    product_id!,
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
        <>
          <VariantGeneralSection variant={variant} />
          <VariantMediaSection variant={variant} />
        </>
      )}
    </SingleColumnPage>
  )
}

export const ProductVariantDetail = Object.assign(Root, {
  GeneralSection: VariantGeneralSection,
  MediaSection: VariantMediaSection,
})
