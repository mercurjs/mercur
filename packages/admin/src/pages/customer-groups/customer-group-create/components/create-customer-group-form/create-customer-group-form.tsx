import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateCustomerGroup } from "../../../../../hooks/api/customer-groups"

export const CreateCustomerGroupSchema = zod.object({
  name: zod.string().min(1),
})

export const CreateCustomerGroupForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof CreateCustomerGroupSchema>>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(CreateCustomerGroupSchema),
  })

  const { mutateAsync, isPending } = useCreateCustomerGroup()

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
      },
      {
        onSuccess: ({ customer_group }) => {
          toast.success(
            t("customerGroups.create.successToast", {
              name: customer_group.name,
            })
          )

          handleSuccess(`/customer-groups/${customer_group.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="create-customer-group-form">
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
        data-testid="create-customer-group-form-keybound"
      >
        <RouteFocusModal.Header data-testid="create-customer-group-form-header" />
        <RouteFocusModal.Body className="flex flex-col items-center pt-[72px]" data-testid="create-customer-group-form-body">
          <div className="flex size-full max-w-[720px] flex-col gap-y-8" data-testid="create-customer-group-form-content">
            <div data-testid="create-customer-group-form-header-section">
              <RouteFocusModal.Title asChild>
                <Heading data-testid="create-customer-group-form-title">{t("customerGroups.create.header")}</Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text size="small" className="text-ui-fg-subtle" data-testid="create-customer-group-form-hint">
                  {t("customerGroups.create.hint")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid grid-cols-2 gap-4" data-testid="create-customer-group-form-fields">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="create-customer-group-form-name-item">
                      <Form.Label data-testid="create-customer-group-form-name-label">{t("fields.name")}</Form.Label>
                      <Form.Control data-testid="create-customer-group-form-name-control">
                        <Input {...field} data-testid="create-customer-group-form-name-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="create-customer-group-form-name-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="create-customer-group-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="create-customer-group-form-footer-actions">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small" data-testid="create-customer-group-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
              data-testid="create-customer-group-form-submit-button"
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
