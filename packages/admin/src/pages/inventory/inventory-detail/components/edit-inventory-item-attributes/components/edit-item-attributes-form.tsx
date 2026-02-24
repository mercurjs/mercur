import type * as zod from "zod"

import { Button, Input, toast } from "@medusajs/ui"

import { zodResolver } from "@hookform/resolvers/zod"
// import { InventoryTypes } from "@medusajs/types"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { useUpdateInventoryItem } from "@hooks/api"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { Form } from "@components/common/form"
import { CountrySelect } from "@components/inputs/country-select"
import type { HttpTypes } from "@medusajs/types"

type EditInventoryItemAttributeFormProps = {
  item: HttpTypes.AdminInventoryItem
}

const EditInventoryItemAttributesSchema = z.object({
  height: z.number().positive().optional(),
  width: z.number().positive().optional(),
  length: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  mid_code: z.string().optional(),
  material: z.string().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
})

const getDefaultValues = (item: HttpTypes.AdminInventoryItem) => {
  return {
    height: item.height ?? undefined,
    width: item.width ?? undefined,
    length: item.length ?? undefined,
    weight: item.weight ?? undefined,
    mid_code: item.mid_code ?? undefined,
    material: item.material ?? undefined,
    hs_code: item.hs_code ?? undefined,
    origin_country: item.origin_country ?? undefined,
  }
}

export const EditInventoryItemAttributesForm = ({
  item,
}: EditInventoryItemAttributeFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const form = useForm<zod.infer<typeof EditInventoryItemAttributesSchema>>({
    defaultValues: getDefaultValues(item),
    resolver: zodResolver(EditInventoryItemAttributesSchema),
  })

  const { mutateAsync, isPending: isLoading } = useUpdateInventoryItem(item.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values, {
      onSuccess: () => {
        toast.success(t("inventory.toast.updateItem"))
        handleSuccess()
      },
      onError: (error) => toast.error(error.message),
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="inventory-edit-item-attributes-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="inventory-edit-item-attributes-keybound-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto" data-testid="inventory-edit-item-attributes-form-body">
          <Form.Field
            control={form.control}
            name="height"
            render={({ field: { onChange, value, ...field } }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-height-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-height-label">{t("fields.height")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-height-control">
                    <div data-testid="inventory-edit-item-attributes-form-height-input-wrapper">
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
                        data-testid="inventory-edit-item-attributes-form-height-input"
                      />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-height-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="width"
            render={({ field: { onChange, value, ...field } }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-width-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-width-label">{t("fields.width")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-width-control">
                    <div data-testid="inventory-edit-item-attributes-form-width-input-wrapper">
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
                        data-testid="inventory-edit-item-attributes-form-width-input"
                      />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-width-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="length"
            render={({ field: { onChange, value, ...field } }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-length-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-length-label">{t("fields.length")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-length-control">
                    <div data-testid="inventory-edit-item-attributes-form-length-input-wrapper">
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
                        data-testid="inventory-edit-item-attributes-form-length-input"
                      />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-length-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="weight"
            render={({ field: { onChange, value, ...field } }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-weight-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-weight-label">{t("fields.weight")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-weight-control">
                    <div data-testid="inventory-edit-item-attributes-form-weight-input-wrapper">
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
                        data-testid="inventory-edit-item-attributes-form-weight-input"
                      />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-weight-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="mid_code"
            render={({ field }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-mid-code-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-mid-code-label">{t("fields.midCode")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-mid-code-control">
                    <div data-testid="inventory-edit-item-attributes-form-mid-code-input-wrapper">
                      <Input {...field} data-testid="inventory-edit-item-attributes-form-mid-code-input" />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-mid-code-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="hs_code"
            render={({ field }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-hs-code-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-hs-code-label">{t("fields.hsCode")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-hs-code-control">
                    <div data-testid="inventory-edit-item-attributes-form-hs-code-input-wrapper">
                      <Input {...field} data-testid="inventory-edit-item-attributes-form-hs-code-input" />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-hs-code-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="material"
            render={({ field }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-material-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-material-label">{t("fields.material")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-material-control">
                    <div data-testid="inventory-edit-item-attributes-form-material-input-wrapper">
                      <Input {...field} data-testid="inventory-edit-item-attributes-form-material-input" />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-material-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="origin_country"
            render={({ field }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-attributes-form-origin-country-item">
                  <Form.Label optional data-testid="inventory-edit-item-attributes-form-origin-country-label">
                    {t("fields.countryOfOrigin")}
                  </Form.Label>
                  <Form.Control data-testid="inventory-edit-item-attributes-form-origin-country-control">
                    <div data-testid="inventory-edit-item-attributes-form-origin-country-select-wrapper">
                      <CountrySelect {...field} data-testid="inventory-edit-item-attributes-form-origin-country-select" />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-attributes-form-origin-country-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="inventory-edit-item-attributes-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="inventory-edit-item-attributes-form-footer-actions">
            <RouteDrawer.Close asChild data-testid="inventory-edit-item-attributes-form-cancel-button-wrapper">
              <Button variant="secondary" size="small" data-testid="inventory-edit-item-attributes-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isLoading} data-testid="inventory-edit-item-attributes-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
