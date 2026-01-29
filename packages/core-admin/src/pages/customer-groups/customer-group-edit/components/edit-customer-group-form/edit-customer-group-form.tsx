import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as z from "zod"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateCustomerGroup } from "../../../../../hooks/api/customer-groups"

type EditCustomerGroupFormProps = {
  group: HttpTypes.AdminCustomerGroup
}

export const EditCustomerGroupSchema = z.object({
  name: z.string().min(1),
})

export const EditCustomerGroupForm = ({
  group,
}: EditCustomerGroupFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof EditCustomerGroupSchema>>({
    defaultValues: {
      name: group.name || "",
    },
    resolver: zodResolver(EditCustomerGroupSchema),
  })

  const { mutateAsync, isPending } = useUpdateCustomerGroup(group.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ customer_group }) => {
        toast.success(
          t("customerGroups.edit.successToast", {
            name: customer_group.name,
          })
        )

        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="edit-customer-group-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="edit-customer-group-form-keybound"
      >
        <RouteDrawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto" data-testid="edit-customer-group-form-body">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <Form.Item data-testid="edit-customer-group-form-name-item">
                  <Form.Label data-testid="edit-customer-group-form-name-label">{t("fields.name")}</Form.Label>
                  <Form.Control data-testid="edit-customer-group-form-name-control">
                    <Input {...field} size="small" data-testid="edit-customer-group-form-name-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="edit-customer-group-form-name-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="edit-customer-group-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="edit-customer-group-form-footer-actions">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="edit-customer-group-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="edit-customer-group-form-submit-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
