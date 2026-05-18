import { Heading, Input, Switch } from "@medusajs/ui"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { AttributeType, ProductAttributeDTO } from "@mercurjs/types"

import { Form } from "../../../../../components/common/form"
import { AttributeValueInput } from "../../../../../components/inputs/attribute-value-input"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { CreateProductVariantSchema } from "./constants"

type DetailsTabProps = {
  product: HttpTypes.AdminProduct
}

function DetailsTab({ product }: DetailsTabProps) {
  const { t } = useTranslation()
  const form = useTabbedForm<z.infer<typeof CreateProductVariantSchema>>()

  const manageInventoryEnabled = useWatch({
    control: form.control,
    name: "manage_inventory",
  })

  const variantAttributes =
    (
      product as HttpTypes.AdminProduct & {
        variant_attributes?: ProductAttributeDTO[]
      }
    ).variant_attributes?.filter((a) => a.is_variant_axis) ?? []

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto" data-testid="product-variant-create-form-details-tab">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16">
        <Heading level="h1" data-testid="product-variant-create-form-details-heading">{t("products.variant.create.header")}</Heading>

        <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-title-item">
                  <Form.Label data-testid="product-variant-create-form-title-label">{t("fields.title")}</Form.Label>
                  <Form.Control data-testid="product-variant-create-form-title-control">
                    <Input {...field} data-testid="product-variant-create-form-title-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-title-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="sku"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-sku-item">
                  <Form.Label optional data-testid="product-variant-create-form-sku-label">{t("fields.sku")}</Form.Label>
                  <Form.Control data-testid="product-variant-create-form-sku-control">
                    <Input {...field} data-testid="product-variant-create-form-sku-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-sku-error" />
                </Form.Item>
              )
            }}
          />

          {variantAttributes.map((attribute) => {
            const fieldKey = attribute.handle ?? attribute.id
            return (
              <Form.Field
                key={attribute.id}
                control={form.control}
                name={`attribute_values.${fieldKey}`}
                render={({ field: { value, onChange } }) => {
                  return (
                    <Form.Item data-testid={`product-variant-create-form-attribute-${attribute.id}-item`}>
                      <Form.Label data-testid={`product-variant-create-form-attribute-${attribute.id}-label`}>{attribute.name}</Form.Label>
                      <Form.Control data-testid={`product-variant-create-form-attribute-${attribute.id}-control`}>
                        <AttributeValueInput
                          type={AttributeType.SINGLE_SELECT}
                          value={typeof value === "string" ? value : ""}
                          onChange={onChange}
                          availableValues={(attribute.values ?? []).map((v) => ({
                            id: v.id,
                            name: v.name,
                          }))}
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid={`product-variant-create-form-attribute-${attribute.id}-error`} />
                    </Form.Item>
                  )
                }}
              />
            )
          })}
        </div>
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="manage_inventory"
            render={({ field: { value, onChange, ...field } }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-manage-inventory-item">
                  <div className="bg-ui-bg-component shadow-elevation-card-rest flex gap-x-3 rounded-lg p-4" data-testid="product-variant-create-form-manage-inventory-container">
                    <Form.Control data-testid="product-variant-create-form-manage-inventory-control">
                      <Switch
                        dir="ltr"
                        className="mt-[2px] rtl:rotate-180"
                        checked={value}
                        onCheckedChange={(checked) => onChange(!!checked)}
                        {...field}
                        data-testid="product-variant-create-form-manage-inventory-switch"
                      />
                    </Form.Control>

                    <div className="flex flex-col">
                      <Form.Label data-testid="product-variant-create-form-manage-inventory-label">
                        {t("products.variant.inventory.manageInventoryLabel")}
                      </Form.Label>
                      <Form.Hint data-testid="product-variant-create-form-manage-inventory-hint">
                        {t("products.variant.inventory.manageInventoryHint")}
                      </Form.Hint>
                    </div>
                  </div>
                  <Form.ErrorMessage data-testid="product-variant-create-form-manage-inventory-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="allow_backorder"
            disabled={!manageInventoryEnabled}
            render={({ field: { value, onChange, ...field } }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-allow-backorder-item">
                  <div className="bg-ui-bg-component shadow-elevation-card-rest flex gap-x-3 rounded-lg p-4" data-testid="product-variant-create-form-allow-backorder-container">
                    <Form.Control data-testid="product-variant-create-form-allow-backorder-control">
                      <Switch
                        dir="ltr"
                        className="rtl:rotate-180"
                        checked={value}
                        onCheckedChange={(checked) => onChange(!!checked)}
                        {...field}
                        disabled={!manageInventoryEnabled}
                        data-testid="product-variant-create-form-allow-backorder-switch"
                      />
                    </Form.Control>
                    <div className="flex flex-col">
                      <Form.Label data-testid="product-variant-create-form-allow-backorder-label">
                        {t("products.variant.inventory.allowBackordersLabel")}
                      </Form.Label>
                      <Form.Hint data-testid="product-variant-create-form-allow-backorder-hint">
                        {t("products.variant.inventory.allowBackordersHint")}
                      </Form.Hint>
                    </div>
                  </div>
                  <Form.ErrorMessage data-testid="product-variant-create-form-allow-backorder-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="inventory_kit"
            render={({ field: { value, onChange, ...field } }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-inventory-kit-item">
                  <div className="bg-ui-bg-component shadow-elevation-card-rest flex gap-x-3 rounded-lg p-4" data-testid="product-variant-create-form-inventory-kit-container">
                    <Form.Control data-testid="product-variant-create-form-inventory-kit-control">
                      <Switch
                        dir="ltr"
                        className="rtl:rotate-180"
                        checked={value}
                        onCheckedChange={(checked) => onChange(!!checked)}
                        {...field}
                        disabled={!manageInventoryEnabled}
                        data-testid="product-variant-create-form-inventory-kit-switch"
                      />
                    </Form.Control>
                    <div className="flex flex-col">
                      <Form.Label data-testid="product-variant-create-form-inventory-kit-label">
                        {t("products.variant.inventory.inventoryKit")}
                      </Form.Label>
                      <Form.Hint data-testid="product-variant-create-form-inventory-kit-hint">
                        {t("products.variant.inventory.inventoryKitHint")}
                      </Form.Hint>
                    </div>
                  </div>
                  <Form.ErrorMessage data-testid="product-variant-create-form-inventory-kit-error" />
                </Form.Item>
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}

DetailsTab._tabMeta = defineTabMeta<z.infer<typeof CreateProductVariantSchema>>({
  id: "detail",
  labelKey: "priceLists.create.tabs.details",
  validationFields: ["title", "sku", "manage_inventory", "allow_backorder", "inventory_kit", "attribute_values"],
})

export default DetailsTab
