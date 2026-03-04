import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { useProduct, useProductVariant } from "../../../hooks/api/products"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { VariantGeneralSection } from "./components/variant-general-section"
import { VariantInventorySectionConnected } from "./components/variant-inventory-section"
import { VariantPricesSection } from "./components/variant-prices-section"
import { ProductSellerSection } from "../../products/product-detail/components/product-seller-section/product-seller-section"
import { VARIANT_DETAIL_FIELDS } from "./constants"
import { variantLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof variantLoader>
  >

  const { id, variant_id } = useParams()
  const { product } = useProduct(id!, {
    fields: "*seller",
  })
  const { variant, isLoading, isError, error } = useProductVariant(
    id!,
    variant_id!,
    { fields: VARIANT_DETAIL_FIELDS },
    {
      initialData,
    }
  )

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

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={variant} showJSON showMetadata hasOutlet>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={variant} showJSON showMetadata hasOutlet>
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={variant} />
        <VariantInventorySectionConnected variant={variant} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ProductSellerSection seller={(product as any)?.seller} />
        <VariantPricesSection variant={variant} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const ProductVariantDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: VariantGeneralSection,
  MainInventorySection: VariantInventorySectionConnected,
  SidebarSellerSection: ProductSellerSection,
  SidebarPricesSection: VariantPricesSection,
})
