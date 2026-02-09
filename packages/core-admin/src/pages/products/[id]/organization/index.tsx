// Route: /products/:id/organization
import { ProductOrganizationDrawer } from "./_components/product-organization-drawer"

// Re-export compound component for user overrides
export { ProductOrganizationDrawer }
export type { ProductOrganizationContextValue } from "./_components/product-organization-context"

export const Component = () => (
  <ProductOrganizationDrawer>
    <ProductOrganizationDrawer.Header />
    <ProductOrganizationDrawer.Form />
  </ProductOrganizationDrawer>
)
