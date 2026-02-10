import { VariantManageItemsModal } from "./_components/variant-manage-items-modal"

// Re-export compound component for user overrides
export { VariantManageItemsModal }
export type { VariantManageItemsModalProps } from "./_components/variant-manage-items-modal"
export type { VariantManageItemsContextValue, VariantWithInventoryItems } from "./_components/variant-manage-items-context"

export const Component = () => (
  <VariantManageItemsModal>
    <VariantManageItemsModal.Content />
  </VariantManageItemsModal>
)
