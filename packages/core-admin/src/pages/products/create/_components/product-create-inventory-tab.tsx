import { ProductCreateInventoryKitForm } from "./product-create-inventory-kit-form"
import { useProductCreateContext } from "./product-create-context"

export function InventoryTab() {
  const { form } = useProductCreateContext()
  return <ProductCreateInventoryKitForm form={form} />
}
