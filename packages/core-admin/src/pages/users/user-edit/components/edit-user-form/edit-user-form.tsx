import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateUser } from "../../../../../hooks/api/users"

type EditUserFormProps = {
  user: HttpTypes.AdminUser
}

const EditUserFormSchema = zod.object({
  first_name: zod.string().optional(),
  last_name: zod.string().optional(),
})

export const EditUserForm = ({ user }: EditUserFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditUserFormSchema>>({
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
    },
    resolver: zodResolver(EditUserFormSchema),
  })

  const { mutateAsync, isPending } = useUpdateUser(user.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values, {
      onSuccess: () => {
        handleSuccess()
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="user-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto" data-testid="user-edit-form-body">
          <Form.Field
            control={form.control}
            name="first_name"
            render={({ field }) => {
              return (
                <Form.Item data-testid="user-edit-form-first-name-item">
                  <Form.Label data-testid="user-edit-form-first-name-label">{t("fields.firstName")}</Form.Label>
                  <Form.Control data-testid="user-edit-form-first-name-control">
                    <Input {...field} data-testid="user-edit-form-first-name-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="user-edit-form-first-name-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="last_name"
            render={({ field }) => {
              return (
                <Form.Item data-testid="user-edit-form-last-name-item">
                  <Form.Label data-testid="user-edit-form-last-name-label">{t("fields.lastName")}</Form.Label>
                  <Form.Control data-testid="user-edit-form-last-name-control">
                    <Input {...field} data-testid="user-edit-form-last-name-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="user-edit-form-last-name-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="user-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="user-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="user-edit-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
