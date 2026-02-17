import { Children, ReactNode } from "react"
import { UseFormReturn } from "react-hook-form"

import { ProductCreateSchemaType, TabDefinition } from "../types"
import { ProductCreateInventoryKitSection } from "./components/product-create-inventory-kit-section/product-create-inventory-kit-section"

const Root = ({ children }: { children?: ReactNode }) => {
  if (Children.count(children) > 0) {
    return (
      <div className="flex flex-col items-center p-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <ProductCreateInventoryKitSection />
      </div>
    </div>
  )
}

Root._tabMeta = {
  id: "inventory",
  labelKey: "products.create.tabs.inventory",
  isVisible: (form: UseFormReturn<ProductCreateSchemaType>) =>
    form.getValues("variants").some((v) => v.manage_inventory && v.inventory_kit),
} satisfies TabDefinition

export const ProductCreateInventoryKitForm = Object.assign(Root, {
  _tabMeta: Root._tabMeta,
  InventoryKitSection: ProductCreateInventoryKitSection,
})
