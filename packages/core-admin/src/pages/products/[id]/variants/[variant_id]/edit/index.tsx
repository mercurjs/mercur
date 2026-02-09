import { VariantEditDrawer } from "./_components/variant-edit-drawer"

// Re-export compound component for user overrides
export { VariantEditDrawer }
export type { VariantEditContextValue } from "./_components/variant-edit-context"

export const Component = () => (
  <VariantEditDrawer>
    <VariantEditDrawer.Header />
    <VariantEditDrawer.Form />
  </VariantEditDrawer>
)

export { editProductVariantLoader as loader } from "./loader"
