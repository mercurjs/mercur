// Route: /products/:id/edit
import { ProductEditDrawer } from "./_components/product-edit-drawer"

// Re-export compound component for user overrides
export { ProductEditDrawer }
export type { ProductEditContextValue } from "./_components/product-edit-context"

export const Component = () => (
  <ProductEditDrawer>
    <ProductEditDrawer.Header />
    <ProductEditDrawer.Form />
  </ProductEditDrawer>
)
