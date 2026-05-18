import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { useProductVariant } from "@hooks/api/products"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { VariantGeneralSection } from "./components/variant-general-section"
import { VariantInventorySectionConnected } from "./components/variant-inventory-section"
import { VariantPricesSection } from "./components/variant-prices-section"
import { variantLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof variantLoader>
  >

  const { product_id, variant_id } = useParams()
  const { variant, isLoading, isError, error } = useProductVariant(
    product_id!,
    variant_id!,
    {},
    {
      initialData,
    }
  )

  if (isLoading || !variant) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} />
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={variant} hasOutlet>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={variant} hasOutlet>
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={variant} />
        <VariantInventorySectionConnected variant={variant} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <VariantPricesSection variant={variant} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const ProductVariantDetail = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: VariantGeneralSection,
  MainInventorySection: VariantInventorySectionConnected,
  SidebarPricesSection: VariantPricesSection,
})
