import { Heading, Input, Switch } from "@medusajs/ui"
import { UseFormReturn, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"

import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { CreateProductVariantSchema } from "./constants"

type DetailsTabProps = {
  product: HttpTypes.AdminProduct
  form: UseFormReturn<z.infer<typeof CreateProductVariantSchema>>
}

function DetailsTab({ form, product }: DetailsTabProps) {
  const { t } = useTranslation()

  const manageInventoryEnabled = useWatch({
    control: form.control,
    name: "manage_inventory",
  })

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

          {product.options?.map((option: any) => (
            <Form.Field
              key={option.id}
              control={form.control}
              name={`options.${option.title}`}
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item data-testid={`product-variant-create-form-option-${option.title}-item`}>
                    <Form.Label data-testid={`product-variant-create-form-option-${option.title}-label`}>{option.title}</Form.Label>
                    <Form.Control data-testid={`product-variant-create-form-option-${option.title}-control`}>
                      <Combobox
                        value={value}
                        onChange={(v) => {
                          onChange(v)
                        }}
                        {...field}
                        options={option.values.map((v: any) => ({
                          label: v.value,
                          value: v.value,
                        }))}
                        data-testid={`product-variant-create-form-option-${option.title}-combobox`}
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid={`product-variant-create-form-option-${option.title}-error`} />
                  </Form.Item>
                )
              }}
            />
          ))}
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

export default DetailsTab
