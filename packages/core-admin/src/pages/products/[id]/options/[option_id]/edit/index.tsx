// Route: /products/:id/options/:option_id/edit
import { ProductOptionEditDrawer } from "./_components/product-option-edit-drawer"

// Re-export compound component for user overrides
export { ProductOptionEditDrawer }
export type { ProductOptionEditContextValue } from "./_components/product-option-edit-context"

export const Component = () => (
  <ProductOptionEditDrawer>
    <ProductOptionEditDrawer.Header />
    <ProductOptionEditDrawer.Form />
  </ProductOptionEditDrawer>
)
