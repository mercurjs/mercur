import { ProductMediaModal } from "./_components/product-media-modal"

// Re-export compound component for user overrides
export { ProductMediaModal }
export type { ProductMediaModalProps } from "./_components/product-media-modal"
export type { ProductMediaContextValue } from "./_components/product-media-context"

export const Component = () => (
  <ProductMediaModal>
    <ProductMediaModal.Title />
    <ProductMediaModal.Content />
  </ProductMediaModal>
)
