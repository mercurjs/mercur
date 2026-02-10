import { VariantDetailPage } from "./_components"

// Re-export compound component for user overrides
export { VariantDetailPage }
export type { VariantDetailPageProps } from "./_components/variant-detail-page"
export type { VariantDetailContextValue } from "./_components/variant-detail-context"

const ProductVariantDetail = () => (
  <VariantDetailPage>
    <VariantDetailPage.Main>
      <VariantDetailPage.GeneralSection />
      <VariantDetailPage.InventorySection />
    </VariantDetailPage.Main>
    <VariantDetailPage.Sidebar>
      <VariantDetailPage.PricesSection />
    </VariantDetailPage.Sidebar>
  </VariantDetailPage>
)

export const Component = ProductVariantDetail
export { variantLoader as loader } from "./loader"
export { ProductVariantDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
