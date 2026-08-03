import { Button, Input, toast } from "@medusajs/ui"

import type { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { useUpdateInventoryItem } from "@hooks/api"


type EditInventoryItemFormProps = {
  item: HttpTypes.AdminInventoryItem
}

const getDefaultValues = (item: HttpTypes.AdminInventoryItem) => {
  return {
    title: item.title ?? "",
    sku: item.sku ?? undefined,
  }
}

export const EditInventoryItemForm = ({ item }: EditInventoryItemFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const EditInventoryItemSchema = z.object({
    title: z.string().min(1, t("validation.requiredField")),
    sku: z.string().optional(),
  })

  const form = useExtendableForm({
    schema: EditInventoryItemSchema,
    model: "inventory_item",
    zone: "edit",
    data: item,
    defaultValues: getDefaultValues(item),
  })

  const { mutateAsync, isPending: isLoading } = useUpdateInventoryItem(item.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    mutateAsync({ title: values.title, sku: values.sku }, {
      onSuccess: () => {
        toast.success(t("inventory.toast.updateItem"))
        handleSuccess()
      },
      onError: (e) => toast.error(e.message),
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="inventory-edit-item-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="inventory-edit-item-keybound-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-auto" data-testid="inventory-edit-item-form-body">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-form-title-item">
                  <Form.Label data-testid="inventory-edit-item-form-title-label">{t("fields.title")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-form-title-control">
                    <div data-testid="inventory-edit-item-form-title-input-wrapper">
                      <Input {...field} data-testid="inventory-edit-item-form-title-input" />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-form-title-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="sku"
            render={({ field }) => {
              return (
                <Form.Item data-testid="inventory-edit-item-form-sku-item">
                  <Form.Label optional data-testid="inventory-edit-item-form-sku-label">{t("fields.sku")}</Form.Label>
                  <Form.Control data-testid="inventory-edit-item-form-sku-control">
                    <div data-testid="inventory-edit-item-form-sku-input-wrapper">
                      <Input {...field} data-testid="inventory-edit-item-form-sku-input" />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-edit-item-form-sku-error" />
                </Form.Item>
              )
            }}
          />
          <FormExtensionZone
            model="inventory_item"
            zone="edit"
            control={form.control}
            data={item}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="inventory-edit-item-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="inventory-edit-item-form-footer-actions">
            <RouteDrawer.Close asChild data-testid="inventory-edit-item-form-cancel-button-wrapper">
              <Button variant="secondary" size="small" data-testid="inventory-edit-item-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isLoading} data-testid="inventory-edit-item-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
