// Route: /products/:id
// Product detail page using compound component pattern
// User can override this file to customize the product detail layout

import { ProductDetailPage, loader, Breadcrumb } from "./_components"

// Re-export for route loader and breadcrumb
export { loader, Breadcrumb }

// Main component - uses compound component with default layout
export const Component = () => {
  return (
    <ProductDetailPage>
      <ProductDetailPage.Main>
        <ProductDetailPage.GeneralSection />
        <ProductDetailPage.MediaSection />
        <ProductDetailPage.OptionSection />
        <ProductDetailPage.VariantSection />
      </ProductDetailPage.Main>
      <ProductDetailPage.Sidebar>
        <ProductDetailPage.SalesChannelSection />
        <ProductDetailPage.ShippingProfileSection />
        <ProductDetailPage.OrganizationSection />
        <ProductDetailPage.AttributeSection />
        <ProductDetailPage.AdditionalAttributeSection />
      </ProductDetailPage.Sidebar>
    </ProductDetailPage>
  )
}
