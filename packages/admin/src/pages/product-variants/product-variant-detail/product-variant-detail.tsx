import { Children, ComponentProps, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { useProductVariant } from "../../../hooks/api/products"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"

import { VariantGeneralSection } from "./components/variant-general-section"
import { VariantInventorySectionConnected } from "./components/variant-inventory-section"
import { VariantPricesSection } from "./components/variant-prices-section"
import { VARIANT_DETAIL_FIELDS } from "./constants"
import {
  ProductVariantDetailProvider,
  useProductVariantDetailContext,
} from "./context"
import { variantLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
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
    <ProductVariantDetailProvider variant={variant}>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <Layout>
          <TwoColumnPage.Main>
            <VariantGeneralSection />
            <VariantInventorySectionConnected />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <VariantPricesSection />
          </TwoColumnPage.Sidebar>
        </Layout>
      )}
    </ProductVariantDetailProvider>
  )
}

const Layout = ({
  children,
  ...props
}: Omit<ComponentProps<typeof TwoColumnPage>, "data"> & {
  children: ReactNode
}) => {
  const { variant } = useProductVariantDetailContext()
  return (
    <TwoColumnPage showJSON showMetadata hasOutlet data={variant} {...props}>
      {children}
    </TwoColumnPage>
  )
}

export const ProductVariantDetail = Object.assign(Root, {
  Layout,
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  GeneralSection: VariantGeneralSection,
  InventorySection: VariantInventorySectionConnected,
  PricesSection: VariantPricesSection,
  useContext: useProductVariantDetailContext,
})
