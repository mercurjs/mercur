import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { ProductCreateSchemaType } from "../../types"
import { ProductCreateInventoryKitSection } from "./components/product-create-inventory-kit-section/product-create-inventory-kit-section"

const Root = () => {
  return (
    <div className="flex flex-col items-center p-16" data-testid="product-create-inventory-kit-form">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8" data-testid="product-create-inventory-kit-form-content">
        <ProductCreateInventoryKitSection />
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "inventory",
  labelKey: "products.create.tabs.inventory",
  validationFields: ["variants"],
})

export const ProductCreateInventoryKitForm = Root
