import { Heading } from "@medusajs/ui"
import {
  ExtendableFormField,
  FormExtensionZone,
} from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { useTabbedForm } from "@components/tabbed-form/tabbed-form"
import { defineTabMeta } from "@components/tabbed-form/types"
import { PRODUCT_CREATE_FIELD_IDS } from "../../constants"
import { ProductCreateSchemaType } from "../../types"
import { ProductCreateGeneralSection } from "./components/product-create-details-general-section"
import { ProductCreateMediaSection } from "./components/product-create-details-media-section"

const Root = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="product-create-details-form"
    >
      <div
        className="flex w-full max-w-[720px] flex-col gap-y-8"
        data-testid="product-create-details-form-content"
      >
        <Header />
        <div
          className="flex flex-col gap-y-6"
          data-testid="product-create-details-form-sections"
        >
          <ProductCreateGeneralSection />
          <ExtendableFormField
            model="product"
            zone="create"
            tab="details"
            id="media"
            control={form.control}
          >
            <ProductCreateMediaSection />
          </ExtendableFormField>
          <FormExtensionZone
            model="product"
            zone="create"
            tab="details"
            control={form.control}
            builtInFieldIds={PRODUCT_CREATE_FIELD_IDS}
          />
        </div>
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "details",
  labelKey: "products.create.tabs.details",
  validationFields: ["title", "handle", "description", "media"],
})

export const ProductCreateDetailsForm = Root

const Header = () => {
  const { t } = useTranslation()

  return (
    <div
      className="flex flex-col"
      data-testid="product-create-details-form-header"
    >
      <Heading data-testid="product-create-details-form-heading">
        {t("products.create.header")}
      </Heading>
    </div>
  )
}
