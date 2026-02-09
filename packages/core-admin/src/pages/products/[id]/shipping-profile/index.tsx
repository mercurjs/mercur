// Route: /products/:id/shipping-profile
import { ProductShippingProfileDrawer } from "./_components/product-shipping-profile-drawer"

// Re-export compound component for user overrides
export { ProductShippingProfileDrawer }
export type { ProductShippingProfileContextValue } from "./_components/product-shipping-profile-context"

export const Component = () => (
  <ProductShippingProfileDrawer>
    <ProductShippingProfileDrawer.Header />
    <ProductShippingProfileDrawer.Form />
  </ProductShippingProfileDrawer>
)
