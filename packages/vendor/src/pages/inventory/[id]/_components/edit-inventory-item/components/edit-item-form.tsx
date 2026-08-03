import { Button, Input, toast } from "@medusajs/ui"
import { RouteDrawer, useRouteModal } from "@components/modals"

import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Form } from "@components/common/form"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateInventoryItem } from "@hooks/api/inventory"
import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"

type EditInventoryItemFormProps = {
  item: HttpTypes.AdminInventoryItem
}

const getDefaultValues = (item: HttpTypes.AdminInventoryItem) => {
  return {
    title: item.title ?? "",
    sku: item.sku ?? "",
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
    mutateAsync(
      { title: values.title, sku: values.sku },
      {
        onSuccess: () => {
          toast.success(t("inventory.toast.updateItem"))
          handleSuccess()
        },
        onError: (e) => toast.error(e.message),
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-auto">
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
          <FormExtensionZone
            model="inventory_item"
            zone="edit"
            control={form.control}
            data={item}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isLoading}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
