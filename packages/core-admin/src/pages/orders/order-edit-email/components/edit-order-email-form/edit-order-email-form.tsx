import * as zod from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateOrder } from "../../../../../hooks/api/orders"

type EditOrderEmailFormProps = {
  order: HttpTypes.AdminOrder
}

const EditOrderEmailSchema = zod.object({
  email: zod.string().email(),
})

export function EditOrderEmailForm({ order }: EditOrderEmailFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditOrderEmailSchema>>({
    defaultValues: {
      email: order.email || "",
    },
    resolver: zodResolver(EditOrderEmailSchema),
  })

  const { mutateAsync, isPending } = useUpdateOrder(order.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await mutateAsync({
        email: data.email,
      })
      toast.success(
        t("orders.edit.email.requestSuccess", { email: data.email })
      )
      handleSuccess()
    } catch (error) {
      toast.error((error as Error).message)
    }
  })

  return (
    <RouteDrawer.Form form={form} data-testid="order-edit-email-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
        data-testid="order-edit-email-form"
      >
        <RouteDrawer.Body className="flex-1 overflow-auto" data-testid="order-edit-email-body">
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => {
              return (
                <Form.Item data-testid="order-edit-email-item">
                  <Form.Label data-testid="order-edit-email-label">{t("fields.email")}</Form.Label>

                  <Form.Control data-testid="order-edit-email-control">
                    <Input type="email" {...field} data-testid="order-edit-email-input" />
                  </Form.Control>

                  <Form.ErrorMessage data-testid="order-edit-email-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="order-edit-email-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="order-edit-email-form-footer-actions">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" data-testid="order-edit-email-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              data-testid="order-edit-email-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
