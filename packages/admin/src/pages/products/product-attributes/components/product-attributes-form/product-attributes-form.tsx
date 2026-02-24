import { HttpTypes } from "@medusajs/types"
import { Button, Input } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Form } from "../../../../../components/common/form"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import {
  FormExtensionZone,
  useExtendableForm,
} from "../../../../../dashboard-app"
import { useUpdateProduct } from "../../../../../hooks/api/products"
import { useExtension } from "../../../../../providers/extension-provider"

type ProductAttributesFormProps = {
  product: HttpTypes.AdminProduct
}

const dimension = zod
  .union([zod.string(), zod.number()])
  .transform((value) => {
    if (value === "") {
      return null
    }
    return Number(value)
  })
  .optional()
  .nullable()

const ProductAttributesSchema = zod.object({
  weight: dimension,
  length: dimension,
  width: dimension,
  height: dimension,
  mid_code: zod.string().optional(),
  hs_code: zod.string().optional(),
  origin_country: zod.string().optional(),
})

export const ProductAttributesForm = ({
  product,
}: ProductAttributesFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { getFormConfigs, getFormFields } = useExtension()

  const configs = getFormConfigs("product", "attributes")
  const fields = getFormFields("product", "attributes")

  const form = useExtendableForm({
    defaultValues: {
      height: product.height ? product.height : null,
      width: product.width ? product.width : null,
      length: product.length ? product.length : null,
      weight: product.weight ? product.weight : null,
      mid_code: product.mid_code || "",
      hs_code: product.hs_code || "",
      origin_country: product.origin_country || "",
    },
    schema: ProductAttributesSchema,
    configs: configs,
    data: product,
  })

  const { mutateAsync, isPending } = useUpdateProduct(product.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        weight: data.weight ? data.weight : null,
        length: data.length ? data.length : null,
        width: data.width ? data.width : null,
        height: data.height ? data.height : null,
        mid_code: data.mid_code,
        hs_code: data.hs_code,
        origin_country: data.origin_country,
      },
      {
        onSuccess: () => {
          handleSuccess()
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="product-attributes-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col" data-testid="product-attributes-keybound-form">
        <RouteDrawer.Body data-testid="product-attributes-form-body">
          <div className="flex h-full flex-col gap-y-8" data-testid="product-attributes-form-fields">
            <div className="flex flex-col gap-y-4" data-testid="product-attributes-form-main-fields">
              <Form.Field
                control={form.control}
                name="width"
                render={({ field: { onChange, value, ...field } }) => {
                  return (
                    <Form.Item data-testid="product-attributes-form-width-item">
                      <Form.Label data-testid="product-attributes-form-width-label">{t("fields.width")}</Form.Label>
                      <Form.Control data-testid="product-attributes-form-width-control">
                        <Input
                          type="number"
                          min={0}
                          value={value || ""}
                          onChange={(e) => {
                            const value = e.target.value

                            if (value === "") {
                              onChange(null)
                            } else {
                              onChange(parseFloat(value))
                            }
                          }}
                          {...field}
                          data-testid="product-attributes-form-width-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-attributes-form-width-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="height"
                render={({ field: { onChange, value, ...field } }) => {
                  return (
                    <Form.Item data-testid="product-attributes-form-height-item">
                      <Form.Label data-testid="product-attributes-form-height-label">{t("fields.height")}</Form.Label>
                      <Form.Control data-testid="product-attributes-form-height-control">
                        <Input
                          type="number"
                          min={0}
                          value={value || ""}
                          onChange={(e) => {
                            const value = e.target.value

                            if (value === "") {
                              onChange(null)
                            } else {
                              onChange(Number(value))
                            }
                          }}
                          {...field}
                          data-testid="product-attributes-form-height-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-attributes-form-height-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="length"
                render={({ field: { onChange, value, ...field } }) => {
                  return (
                    <Form.Item data-testid="product-attributes-form-length-item">
                      <Form.Label data-testid="product-attributes-form-length-label">{t("fields.length")}</Form.Label>
                      <Form.Control data-testid="product-attributes-form-length-control">
                        <Input
                          type="number"
                          min={0}
                          value={value || ""}
                          onChange={(e) => {
                            const value = e.target.value

                            if (value === "") {
                              onChange(null)
                            } else {
                              onChange(Number(value))
                            }
                          }}
                          {...field}
                          data-testid="product-attributes-form-length-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-attributes-form-length-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="weight"
                render={({ field: { onChange, value, ...field } }) => {
                  return (
                    <Form.Item data-testid="product-attributes-form-weight-item">
                      <Form.Label data-testid="product-attributes-form-weight-label">{t("fields.weight")}</Form.Label>
                      <Form.Control data-testid="product-attributes-form-weight-control">
                        <Input
                          type="number"
                          min={0}
                          value={value || ""}
                          onChange={(e) => {
                            const value = e.target.value

                            if (value === "") {
                              onChange(null)
                            } else {
                              onChange(Number(value))
                            }
                          }}
                          {...field}
                          data-testid="product-attributes-form-weight-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-attributes-form-weight-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="mid_code"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-attributes-form-mid-code-item">
                      <Form.Label data-testid="product-attributes-form-mid-code-label">{t("fields.midCode")}</Form.Label>
                      <Form.Control data-testid="product-attributes-form-mid-code-control">
                        <Input {...field} data-testid="product-attributes-form-mid-code-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-attributes-form-mid-code-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="hs_code"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-attributes-form-hs-code-item">
                      <Form.Label data-testid="product-attributes-form-hs-code-label">{t("fields.hsCode")}</Form.Label>
                      <Form.Control data-testid="product-attributes-form-hs-code-control">
                        <Input {...field} data-testid="product-attributes-form-hs-code-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-attributes-form-hs-code-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="origin_country"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-attributes-form-origin-country-item">
                      <Form.Label data-testid="product-attributes-form-origin-country-label">{t("fields.countryOfOrigin")}</Form.Label>
                      <Form.Control data-testid="product-attributes-form-origin-country-control">
                        <CountrySelect {...field} data-testid="product-attributes-form-origin-country-select" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-attributes-form-origin-country-error" />
                    </Form.Item>
                  )
                }}
              />
              <FormExtensionZone fields={fields} form={form} data-testid="product-attributes-form-extension-zone" />
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-attributes-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="product-attributes-form-footer-actions">
            <RouteDrawer.Close asChild data-testid="product-attributes-form-cancel-button-wrapper">
              <Button size="small" variant="secondary" data-testid="product-attributes-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="product-attributes-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
