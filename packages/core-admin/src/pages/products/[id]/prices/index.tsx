import { ProductPricesModal } from "./_components/product-prices-modal"

// Re-export compound component for user overrides
export { ProductPricesModal }
export type { ProductPricesModalProps } from "./_components/product-prices-modal"
export type { ProductPricesContextValue } from "./_components/product-prices-context"

export const Component = () => (
  <ProductPricesModal>
    <ProductPricesModal.Content />
  </ProductPricesModal>
)
