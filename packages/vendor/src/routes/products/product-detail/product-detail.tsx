import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useProduct } from "../../../hooks/api/products"
import { ProductAttributeSection } from "./components/product-attribute-section"
import { ProductGeneralSection } from "./components/product-general-section"
import { ProductMediaSection } from "./components/product-media-section"
import { ProductOptionSection } from "./components/product-option-section"
import { ProductOrganizationSection } from "./components/product-organization-section"
import { ProductSalesChannelSection } from "./components/product-sales-channel-section"
import { ProductVariantSection } from "./components/product-variant-section"
import { productLoader } from "./loader"


import { ProductShippingProfileSection } from "./components/product-shipping-profile-section"

export const ProductDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productLoader>
  >

  const { id } = useParams()
  const { product, isLoading, isError, error } = useProduct(
    id!,
    {
      initialData: initialData,
    }
  )

  if (isLoading || !product) {
    return (
      <TwoColumnPageSkeleton
        mainSections={4}
        sidebarSections={3}
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
      showJSON
      showMetadata
      data={product}
    >
      <TwoColumnPage.Main>
        <ProductGeneralSection product={product} />
        <ProductMediaSection product={product} />
        <ProductOptionSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ProductSalesChannelSection product={product} />
        <ProductShippingProfileSection product={product} />
        <ProductOrganizationSection product={product} />
        <ProductAttributeSection product={product} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
