import { Children, ReactNode } from "react"
import { useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useProduct } from "@hooks/api"

import { ProductDetailProvider, useProductDetailContext } from "./context"
import { PRODUCT_DETAIL_FIELDS } from "./constants"

import { ProductGeneralSection } from "./_components/product-general-section"
import { ProductMediaSection } from "./_components/product-media-section"
import { ProductOptionSection } from "./_components/product-option-section"
import { ProductOrganizationSection } from "./_components/product-organization-section"
import { ProductVariantSection } from "./_components/product-variant-section"
import { ProductAttributeSection } from "./_components/product-attribute-section"
import { ProductAdditionalAttributesSection } from "./_components/product-additional-attribute-section"
import { ProductShippingProfileSection } from "./_components/product-shipping-profile-section"
import { ProductSalesChannelSection } from "./_components/product-sales-channel-section"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isLoading || !product) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={3} />
  }

  if (isError) {
    throw error
  }

  return (
    <ProductDetailProvider product={product}>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={product}>
          <TwoColumnPage.Main>
            <ProductGeneralSection />
            <ProductMediaSection />
            <ProductOptionSection />
            <ProductVariantSection />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <ProductOrganizationSection />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </ProductDetailProvider>
  )
}

export const ProductDetailPage = Object.assign(Root, {
  GeneralSection: ProductGeneralSection,
  MediaSection: ProductMediaSection,
  OptionSection: ProductOptionSection,
  VariantSection: ProductVariantSection,
  OrganizationSection: ProductOrganizationSection,
  AttributeSection: ProductAttributeSection,
  AdditionalAttributeSection: ProductAdditionalAttributesSection,
  ShippingProfileSection: ProductShippingProfileSection,
  SalesChannelSection: ProductSalesChannelSection,
  useContext: useProductDetailContext,
})
