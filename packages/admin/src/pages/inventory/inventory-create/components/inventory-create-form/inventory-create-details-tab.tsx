import {
  Divider,
  Heading,
  Input,
  Textarea,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { CreateInventoryItemSchema } from "./schema"

const Root = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<CreateInventoryItemSchema>()

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-3">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-px py-16" data-testid="inventory-create-form-content">
        <div className="flex flex-col gap-y-8">
          <div data-testid="inventory-create-form-header">
            <Heading data-testid="inventory-create-form-heading">{t("inventory.create.title")}</Heading>
          </div>
          <div className="flex flex-col gap-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => (
                  <Form.Item data-testid="inventory-create-form-title-item">
                    <Form.Label data-testid="inventory-create-form-title-label">{t("fields.title")}</Form.Label>
                    <Form.Control data-testid="inventory-create-form-title-control">
                      <Input {...field} placeholder={t("fields.title")} data-testid="inventory-create-form-title-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="inventory-create-form-title-error" />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <Form.Item data-testid="inventory-create-form-sku-item">
                    <Form.Label data-testid="inventory-create-form-sku-label">{t("fields.sku")}</Form.Label>
                    <Form.Control data-testid="inventory-create-form-sku-control">
                      <Input {...field} placeholder="sku-123" data-testid="inventory-create-form-sku-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="inventory-create-form-sku-error" />
                  </Form.Item>
                )}
              />
            </div>
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-description-item">
                  <Form.Label optional data-testid="inventory-create-form-description-label">
                    {t("products.fields.description.label")}
                  </Form.Label>
                  <Form.Control data-testid="inventory-create-form-description-control">
                    <Textarea {...field} placeholder="The item description" data-testid="inventory-create-form-description-textarea" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-description-error" />
                </Form.Item>
              )}
            />
          </div>
          <SwitchBox
            control={form.control}
            name="requires_shipping"
            label={t("inventory.create.requiresShipping")}
            description={t("inventory.create.requiresShippingHint")}
            data-testid="inventory-create-form-requires-shipping"
          />
        </div>

        <Divider />

        <div className="flex flex-col gap-y-6">
          <Heading level="h2">{t("inventory.create.attributes")}</Heading>
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 lg:gap-y-8">
            <Form.Field
              control={form.control}
              name="width"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-width-item">
                  <Form.Label optional data-testid="inventory-create-form-width-label">{t("products.fields.width.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-width-control">
                    <Input {...field} type="number" min={0} placeholder="100" data-testid="inventory-create-form-width-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-width-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="length"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-length-item">
                  <Form.Label optional data-testid="inventory-create-form-length-label">{t("products.fields.length.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-length-control">
                    <Input {...field} type="number" min={0} placeholder="100" data-testid="inventory-create-form-length-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-length-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="height"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-height-item">
                  <Form.Label optional data-testid="inventory-create-form-height-label">{t("products.fields.height.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-height-control">
                    <Input {...field} type="number" min={0} placeholder="100" data-testid="inventory-create-form-height-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-height-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="weight"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-weight-item">
                  <Form.Label optional data-testid="inventory-create-form-weight-label">{t("products.fields.weight.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-weight-control">
                    <Input {...field} type="number" min={0} placeholder="100" data-testid="inventory-create-form-weight-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-weight-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="mid_code"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-mid-code-item">
                  <Form.Label optional data-testid="inventory-create-form-mid-code-label">{t("products.fields.mid_code.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-mid-code-control">
                    <Input {...field} data-testid="inventory-create-form-mid-code-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-mid-code-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="hs_code"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-hs-code-item">
                  <Form.Label optional data-testid="inventory-create-form-hs-code-label">{t("products.fields.hs_code.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-hs-code-control">
                    <Input {...field} data-testid="inventory-create-form-hs-code-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-hs-code-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="origin_country"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-origin-country-item">
                  <Form.Label optional data-testid="inventory-create-form-origin-country-label">{t("products.fields.countryOrigin.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-origin-country-control">
                    <CountrySelect {...field} data-testid="inventory-create-form-origin-country-select" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-origin-country-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="material"
              render={({ field }) => (
                <Form.Item data-testid="inventory-create-form-material-item">
                  <Form.Label optional data-testid="inventory-create-form-material-label">{t("products.fields.material.label")}</Form.Label>
                  <Form.Control data-testid="inventory-create-form-material-control">
                    <Input {...field} data-testid="inventory-create-form-material-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-create-form-material-error" />
                </Form.Item>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<CreateInventoryItemSchema>({
  id: "details",
  labelKey: "inventory.create.details",
  validationFields: [
    "title", "sku", "description", "hs_code", "weight", "length",
    "height", "width", "origin_country", "mid_code", "material",
    "requires_shipping", "thumbnail",
  ],
})

export const InventoryCreateDetailsTab = Root
