// Route: /products/:id/attributes
import { ProductAttributesDrawer } from "./_components/product-attributes-drawer"

// Re-export compound component for user overrides
export { ProductAttributesDrawer }
export type { ProductAttributesContextValue } from "./_components/product-attributes-context"

export const Component = () => (
  <ProductAttributesDrawer>
    <ProductAttributesDrawer.Header />
    <ProductAttributesDrawer.Form />
  </ProductAttributesDrawer>
)
