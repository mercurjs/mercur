import { Heading, Input } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { ProductDTO, AttributeType } from "@mercurjs/types"

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

  const variantAttributes =
    (
      product as HttpTypes.AdminProduct & Pick<ProductDTO, "attributes">
    ).attributes?.filter((a) => a.is_variant_axis) ?? []

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
                name={`options.${fieldKey}`}
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
      </div>
    </div>
  )
}

DetailsTab._tabMeta = defineTabMeta<z.infer<typeof CreateProductVariantSchema>>({
  id: "detail",
  labelKey: "priceLists.create.tabs.details",
  validationFields: ["title", "sku", "options"],
})

export default DetailsTab
