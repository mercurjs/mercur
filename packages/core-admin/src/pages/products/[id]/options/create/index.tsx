// Route: /products/:id/options/create
import { ProductOptionCreateDrawer } from "./_components/product-option-create-drawer"

// Re-export compound component for user overrides
export { ProductOptionCreateDrawer }
export type { ProductOptionCreateContextValue } from "./_components/product-option-create-context"

export const Component = () => (
  <ProductOptionCreateDrawer>
    <ProductOptionCreateDrawer.Header />
    <ProductOptionCreateDrawer.Form />
  </ProductOptionCreateDrawer>
)
