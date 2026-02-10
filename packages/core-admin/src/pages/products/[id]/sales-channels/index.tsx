import { ProductSalesChannelsModal } from "./_components/product-sales-channels-modal"

// Re-export compound component for user overrides
export { ProductSalesChannelsModal }
export type { ProductSalesChannelsModalProps } from "./_components/product-sales-channels-modal"
export type { ProductSalesChannelsContextValue } from "./_components/product-sales-channels-context"

export const Component = () => (
  <ProductSalesChannelsModal>
    <ProductSalesChannelsModal.Content />
  </ProductSalesChannelsModal>
)
