// Route: /sellers/:id
// Seller detail page using compound component pattern

import { SellerDetailPage } from "./_components"

// Re-export compound component and types for user overrides
export { SellerDetailPage }
export type { SellerDetailPageProps } from "./_components/seller-detail-page"
export type { SellerDetailContextValue } from "./_components/seller-detail-context"

export const Component = () => {
  return (
    <SellerDetailPage>
      <SellerDetailPage.GeneralSection />
      <SellerDetailPage.OrdersSection />
      <SellerDetailPage.ProductsSection />
      <SellerDetailPage.CustomerGroupsSection />
    </SellerDetailPage>
  )
}
