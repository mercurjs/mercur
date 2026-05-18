import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Divider, Heading, Input, Switch, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import {
  AttributeType,
  ProductAttributeDTO,
  ProductAttributeValueDTO,
} from "@mercurjs/types"

import { Form } from "@components/common/form"
import { AttributeValueInput } from "@components/inputs/attribute-value-input"
import { CountrySelect } from "@components/inputs/country-select"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateProductVariant } from "@hooks/api/products"
import {
  transformNullableFormData,
  transformNullableFormNumber,
} from "@lib/form-helpers"
import { optionalInt } from "@lib/validation"

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
  attribute_values: z
    .record(z.union([z.string(), z.array(z.string())]))
    .optional(),
})

export const ProductEditVariantForm = ({
  variant,
  product,
}: ProductEditVariantFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const variantAttributes =
    (
      product as HttpTypes.AdminProduct & {
        variant_attributes?: ProductAttributeDTO[]
      }
    ).variant_attributes?.filter((a) => a.is_variant_axis) ?? []

  const variantAttrValues =
    (
      variant as HttpTypes.AdminProductVariant & {
        attribute_values?: ProductAttributeValueDTO[]
      }
    ).attribute_values ?? []

  const defaultAttributeValues = variantAttributes.reduce<
    Record<string, string>
  >((acc, attribute) => {
    const key = attribute.handle ?? attribute.id
    const matched = variantAttrValues.find(
      (v) => v.attribute?.id === attribute.id,
    )
    acc[key] = matched?.name ?? ""
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
      attribute_values: defaultAttributeValues,
    },
    resolver: zodResolver(ProductEditVariantSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductVariant(
    variant.product_id!,
    variant.id,
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
      attribute_values,
      ...optional
    } = data

    const nullableData = transformNullableFormData(optional)

    const cleanedAttributeValues = Object.fromEntries(
      Object.entries(attribute_values ?? {}).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : !!v,
      ),
    ) as Record<string, string | string[]>

    await mutateAsync(
      {
        weight: transformNullableFormNumber(weight),
        height: transformNullableFormNumber(height),
        width: transformNullableFormNumber(width),
        length: transformNullableFormNumber(length),
        title,
        allow_backorder,
        manage_inventory,
        attribute_values: Object.keys(cleanedAttributeValues).length
          ? cleanedAttributeValues
          : undefined,
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
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex size-full flex-col gap-y-8 overflow-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.title")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="material"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.material")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
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
                      <Form.Item>
                        <Form.Label>{attribute.name}</Form.Label>
                        <Form.Control>
                          <AttributeValueInput
                            type={AttributeType.SINGLE_SELECT}
                            value={typeof value === "string" ? value : ""}
                            onChange={onChange}
                            availableValues={(attribute.values ?? []).map(
                              (v) => ({
                                id: v.id,
                                name: v.name,
                              }),
                            )}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              )
            })}
          </div>
          <Divider />
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              <Heading level="h2">
                {t("products.variant.inventory.header")}
              </Heading>
              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.sku")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="ean"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.ean")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="upc"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.upc")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="barcode"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.barcode")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
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
                  <Form.Item>
                    <div className="flex flex-col gap-y-1">
                      <div className="flex items-center justify-between">
                        <Form.Label>
                          {t("products.variant.inventory.manageInventoryLabel")}
                        </Form.Label>
                        <Form.Control>
                          <Switch
                            dir="ltr"
                            checked={value}
                            className="rtl:rotate-180"
                            onCheckedChange={(checked) => onChange(!!checked)}
                            {...field}
                          />
                        </Form.Control>
                      </div>
                      <Form.Hint>
                        {t("products.variant.inventory.manageInventoryHint")}
                      </Form.Hint>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="allow_backorder"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <div className="flex flex-col gap-y-1">
                      <div className="flex items-center justify-between">
                        <Form.Label>
                          {t("products.variant.inventory.allowBackordersLabel")}
                        </Form.Label>
                        <Form.Control>
                          <Switch
                            dir="ltr"
                            className="rtl:rotate-180"
                            checked={value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            {...field}
                          />
                        </Form.Control>
                      </div>
                      <Form.Hint>
                        {t("products.variant.inventory.allowBackordersHint")}
                      </Form.Hint>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
          <Divider />
          <div className="flex flex-col gap-y-4">
            <Heading level="h2">{t("products.attributes")}</Heading>
            <Form.Field
              control={form.control}
              name="weight"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.weight")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="width"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.width")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="length"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.length")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="height"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.height")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="mid_code"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.midCode")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="hs_code"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.hsCode")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="origin_country"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t("fields.countryOfOrigin")}
                    </Form.Label>
                    <Form.Control>
                      <CountrySelect {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
