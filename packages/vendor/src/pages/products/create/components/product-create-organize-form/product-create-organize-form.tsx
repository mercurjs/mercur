import { FormExtensionZone } from "@mercurjs/dashboard-shared"

import { useTabbedForm } from "@components/tabbed-form/tabbed-form"
import { defineTabMeta } from "@components/tabbed-form/types"
import { PRODUCT_CREATE_FIELD_IDS } from "../../constants"
import { ProductCreateSchemaType } from "../../types"
import { ProductCreateOrganizationSection } from "./components/product-create-organize-section"

const Root = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="product-create-organize-form"
    >
      <div
        className="flex w-full max-w-[720px] flex-col gap-y-8"
        data-testid="product-create-organize-form-content"
      >
        <ProductCreateOrganizationSection />
        <FormExtensionZone
          model="product"
          zone="create"
          tab="organize"
          exactTab
          control={form.control}
          builtInFieldIds={PRODUCT_CREATE_FIELD_IDS}
        />
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "organize",
  labelKey: "products.create.tabs.organize",
  validationFields: [
    "type_id", "collection_id", "category_id", "tags",
    "origin_country", "material",
    "width", "length", "height", "weight", "mid_code", "hs_code",
  ],
})

export const ProductCreateOrganizeForm = Root
