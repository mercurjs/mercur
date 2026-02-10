// Route: /customers/:id
// Customer detail page using compound component pattern

import { CustomerDetailPage, loader, Breadcrumb } from "./_components"

// Re-export for route loader and breadcrumb
export { loader, Breadcrumb }

// Re-export compound component and types for user overrides
export { CustomerDetailPage }
export type { CustomerDetailPageProps } from "./_components/customer-detail-page"
export type { CustomerDetailContextValue } from "./_components/customer-detail-context"

export const Component = () => {
  return (
    <CustomerDetailPage>
      <CustomerDetailPage.Main>
        <CustomerDetailPage.GeneralSection />
        <CustomerDetailPage.OrderSection />
        <CustomerDetailPage.GroupSection />
      </CustomerDetailPage.Main>
      <CustomerDetailPage.Sidebar>
        <CustomerDetailPage.AddressSection />
      </CustomerDetailPage.Sidebar>
    </CustomerDetailPage>
  )
}
