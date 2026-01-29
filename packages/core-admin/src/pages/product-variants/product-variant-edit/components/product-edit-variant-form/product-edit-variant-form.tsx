import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Divider, Heading, Input, Switch, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProductVariant } from "../../../../../hooks/api/products"
import {
  transformNullableFormData,
  transformNullableFormNumber,
} from "../../../../../lib/form-helpers"
import { optionalInt } from "../../../../../lib/validation"

type ProductEditVariantFormProps = {
  product: HttpTypes.AdminProduct
  variant: HttpTypes.AdminProductVariant
}

const ProductEditVariantSchema = z.object({
  title: z.string().min(1),
  material: z.string().optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().optional(),
  manage_inventory: z.boolean(),
  allow_backorder: z.boolean(),
  weight: optionalInt,
  height: optionalInt,
  width: optionalInt,
  length: optionalInt,
  mid_code: z.string().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  options: z.record(z.string()),
})

// TODO: Either pass option ID or make the backend handle options constraints differently to handle the lack of IDs
export const ProductEditVariantForm = ({
  variant,
  product,
}: ProductEditVariantFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const defaultOptions = product.options?.reduce((acc: any, option: any) => {
    const varOpt = variant.options?.find((o: any) => o.option_id === option.id)
    acc[option.title] = varOpt?.value
    return acc
  }, {})

  const form = useForm<z.infer<typeof ProductEditVariantSchema>>({
    defaultValues: {
      title: variant.title || "",
      material: variant.material || "",
      sku: variant.sku || "",
      ean: variant.ean || "",
      upc: variant.upc || "",
      barcode: variant.barcode || "",
      manage_inventory: variant.manage_inventory || false,
      allow_backorder: variant.allow_backorder || false,
      weight: variant.weight || "",
      height: variant.height || "",
      width: variant.width || "",
      length: variant.length || "",
      mid_code: variant.mid_code || "",
      hs_code: variant.hs_code || "",
      origin_country: variant.origin_country || "",
      options: defaultOptions,
    },
    resolver: zodResolver(ProductEditVariantSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductVariant(
    variant.product_id!,
    variant.id
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    const {
      title,
      weight,
      height,
      width,
      length,
      allow_backorder,
      manage_inventory,
      options,
      ...optional
    } = data

    const nullableData = transformNullableFormData(optional)

    await mutateAsync(
      {
        id: variant.id,
        weight: transformNullableFormNumber(weight),
        height: transformNullableFormNumber(height),
        width: transformNullableFormNumber(width),
        length: transformNullableFormNumber(length),
        title,
        allow_backorder,
        manage_inventory,
        options,
        ...nullableData,
      },
      {
        onSuccess: () => {
          handleSuccess("../")
          toast.success(t("products.variant.edit.success"))
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="product-variant-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
        data-testid="product-variant-edit-keybound-form"
      >
        <RouteDrawer.Body className="flex size-full flex-col gap-y-8 overflow-auto" data-testid="product-variant-edit-form-body">
          <div className="flex flex-col gap-y-4" data-testid="product-variant-edit-form-main-fields">
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-title-item">
                    <Form.Label data-testid="product-variant-edit-form-title-label">{t("fields.title")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-title-control">
                      <div data-testid="product-variant-edit-form-title-input-wrapper">
                        <Input {...field} data-testid="product-variant-edit-form-title-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-title-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="material"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-material-item">
                    <Form.Label optional data-testid="product-variant-edit-form-material-label">{t("fields.material")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-material-control">
                      <div data-testid="product-variant-edit-form-material-input-wrapper">
                        <Input {...field} data-testid="product-variant-edit-form-material-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-material-error" />
                  </Form.Item>
                )
              }}
            />
            {product.options?.map((option: any) => {
              const optionKey = option.title.toLowerCase().replace(/\s+/g, "-")
              return (
                <Form.Field
                  key={option.id}
                  control={form.control}
                  name={`options.${option.title}`}
                  render={({ field: { value, onChange, ...field } }) => {
                    return (
                      <Form.Item data-testid={`product-variant-edit-form-option-${optionKey}-item`}>
                        <Form.Label data-testid={`product-variant-edit-form-option-${optionKey}-label`}>{option.title}</Form.Label>
                        <Form.Control data-testid={`product-variant-edit-form-option-${optionKey}-control`}>
                          <div data-testid={`product-variant-edit-form-option-${optionKey}-combobox-wrapper`}>
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
                              data-testid={`product-variant-edit-form-option-${optionKey}-combobox`}
                            />
                          </div>
                        </Form.Control>
                        <Form.ErrorMessage data-testid={`product-variant-edit-form-option-${optionKey}-error`} />
                      </Form.Item>
                    )
                  }}
                />
              )
            })}
          </div>
          <Divider data-testid="product-variant-edit-form-divider-1" />
          <div className="flex flex-col gap-y-8" data-testid="product-variant-edit-form-inventory-section">
            <div className="flex flex-col gap-y-4" data-testid="product-variant-edit-form-inventory-fields">
              <Heading level="h2" data-testid="product-variant-edit-form-inventory-header">
                {t("products.variant.inventory.header")}
              </Heading>
              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-sku-item">
                      <Form.Label optional data-testid="product-variant-edit-form-sku-label">{t("fields.sku")}</Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-sku-control">
                        <div data-testid="product-variant-edit-form-sku-input-wrapper">
                          <Input {...field} data-testid="product-variant-edit-form-sku-input" />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-sku-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="ean"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-ean-item">
                      <Form.Label optional data-testid="product-variant-edit-form-ean-label">{t("fields.ean")}</Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-ean-control">
                        <div data-testid="product-variant-edit-form-ean-input-wrapper">
                          <Input {...field} data-testid="product-variant-edit-form-ean-input" />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-ean-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="upc"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-upc-item">
                      <Form.Label optional data-testid="product-variant-edit-form-upc-label">{t("fields.upc")}</Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-upc-control">
                        <div data-testid="product-variant-edit-form-upc-input-wrapper">
                          <Input {...field} data-testid="product-variant-edit-form-upc-input" />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-upc-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="barcode"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-barcode-item">
                      <Form.Label optional data-testid="product-variant-edit-form-barcode-label">{t("fields.barcode")}</Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-barcode-control">
                        <div data-testid="product-variant-edit-form-barcode-input-wrapper">
                          <Input {...field} data-testid="product-variant-edit-form-barcode-input" />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-barcode-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <Form.Field
              control={form.control}
              name="manage_inventory"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-manage-inventory-item">
                    <div className="flex flex-col gap-y-1" data-testid="product-variant-edit-form-manage-inventory-container">
                      <div className="flex items-center justify-between" data-testid="product-variant-edit-form-manage-inventory-control-row">
                        <Form.Label data-testid="product-variant-edit-form-manage-inventory-label">
                          {t("products.variant.inventory.manageInventoryLabel")}
                        </Form.Label>
                        <Form.Control data-testid="product-variant-edit-form-manage-inventory-control">
                          <div data-testid="product-variant-edit-form-manage-inventory-switch-wrapper">
                            <Switch
                              dir="ltr"
                              checked={value}
                              className="rtl:rotate-180"
                              onCheckedChange={(checked) => onChange(!!checked)}
                              {...field}
                              data-testid="product-variant-edit-form-manage-inventory-switch"
                            />
                          </div>
                        </Form.Control>
                      </div>
                      <Form.Hint data-testid="product-variant-edit-form-manage-inventory-hint">
                        {t("products.variant.inventory.manageInventoryHint")}
                      </Form.Hint>
                    </div>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-manage-inventory-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="allow_backorder"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-allow-backorder-item">
                    <div className="flex flex-col gap-y-1" data-testid="product-variant-edit-form-allow-backorder-container">
                      <div className="flex items-center justify-between" data-testid="product-variant-edit-form-allow-backorder-control-row">
                        <Form.Label data-testid="product-variant-edit-form-allow-backorder-label">
                          {t("products.variant.inventory.allowBackordersLabel")}
                        </Form.Label>
                        <Form.Control data-testid="product-variant-edit-form-allow-backorder-control">
                          <div data-testid="product-variant-edit-form-allow-backorder-switch-wrapper">
                            <Switch
                              dir="ltr"
                              className="rtl:rotate-180"
                              checked={value}
                              onCheckedChange={(checked) => onChange(!!checked)}
                              {...field}
                              data-testid="product-variant-edit-form-allow-backorder-switch"
                            />
                          </div>
                        </Form.Control>
                      </div>
                      <Form.Hint data-testid="product-variant-edit-form-allow-backorder-hint">
                        {t("products.variant.inventory.allowBackordersHint")}
                      </Form.Hint>
                    </div>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-allow-backorder-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
          <Divider data-testid="product-variant-edit-form-divider-2" />
          <div className="flex flex-col gap-y-4" data-testid="product-variant-edit-form-attributes-section">
            <Heading level="h2" data-testid="product-variant-edit-form-attributes-header">{t("products.attributes")}</Heading>
            <Form.Field
              control={form.control}
              name="weight"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-weight-item">
                    <Form.Label optional data-testid="product-variant-edit-form-weight-label">{t("fields.weight")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-weight-control">
                      <div data-testid="product-variant-edit-form-weight-input-wrapper">
                        <Input type="number" {...field} data-testid="product-variant-edit-form-weight-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-weight-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="width"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-width-item">
                    <Form.Label optional data-testid="product-variant-edit-form-width-label">{t("fields.width")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-width-control">
                      <div data-testid="product-variant-edit-form-width-input-wrapper">
                        <Input type="number" {...field} data-testid="product-variant-edit-form-width-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-width-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="length"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-length-item">
                    <Form.Label optional data-testid="product-variant-edit-form-length-label">{t("fields.length")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-length-control">
                      <div data-testid="product-variant-edit-form-length-input-wrapper">
                        <Input type="number" {...field} data-testid="product-variant-edit-form-length-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-length-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="height"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-height-item">
                    <Form.Label optional data-testid="product-variant-edit-form-height-label">{t("fields.height")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-height-control">
                      <div data-testid="product-variant-edit-form-height-input-wrapper">
                        <Input type="number" {...field} data-testid="product-variant-edit-form-height-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-height-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="mid_code"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-mid-code-item">
                    <Form.Label optional data-testid="product-variant-edit-form-mid-code-label">{t("fields.midCode")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-mid-code-control">
                      <div data-testid="product-variant-edit-form-mid-code-input-wrapper">
                        <Input {...field} data-testid="product-variant-edit-form-mid-code-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-mid-code-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="hs_code"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-hs-code-item">
                    <Form.Label optional data-testid="product-variant-edit-form-hs-code-label">{t("fields.hsCode")}</Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-hs-code-control">
                      <div data-testid="product-variant-edit-form-hs-code-input-wrapper">
                        <Input {...field} data-testid="product-variant-edit-form-hs-code-input" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-hs-code-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="origin_country"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-origin-country-item">
                    <Form.Label optional data-testid="product-variant-edit-form-origin-country-label">
                      {t("fields.countryOfOrigin")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-origin-country-control">
                      <CountrySelect {...field} data-testid="product-variant-edit-form-origin-country-select" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-origin-country-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-variant-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="product-variant-edit-form-footer-actions">
            <RouteDrawer.Close asChild data-testid="product-variant-edit-form-cancel-button-wrapper">
              <Button variant="secondary" size="small" data-testid="product-variant-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending} data-testid="product-variant-edit-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
