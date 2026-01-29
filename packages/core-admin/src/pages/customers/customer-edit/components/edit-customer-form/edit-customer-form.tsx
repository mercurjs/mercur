import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { ConditionalTooltip } from "../../../../../components/common/conditional-tooltip/index.ts"
import { Form } from "../../../../../components/common/form/index.ts"
import {
  RouteDrawer,
  useRouteModal,
} from "../../../../../components/modals/index.ts"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form/keybound-form.tsx"
import { useUpdateCustomer } from "../../../../../hooks/api/customers.tsx"

type EditCustomerFormProps = {
  customer: HttpTypes.AdminCustomer
}

const EditCustomerSchema = zod.object({
  email: zod.string().email(),
  first_name: zod.string().optional(),
  last_name: zod.string().optional(),
  company_name: zod.string().optional(),
  phone: zod.string().optional(),
})

export const EditCustomerForm = ({ customer }: EditCustomerFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  
  const form = useForm<zod.infer<typeof EditCustomerSchema>>({
    defaultValues: {
      email: customer.email || "",
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      company_name: customer.company_name || "",
      phone: customer.phone || "",
    },
    resolver: zodResolver(EditCustomerSchema),
  })

  const { mutateAsync, isPending } = useUpdateCustomer(customer.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        email: customer.has_account ? undefined : data.email,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        phone: data.phone || undefined,
        company_name: data.company_name || undefined,
      },
      {
        onSuccess: ({ customer }) => {
          toast.success(
            t("customers.edit.successToast", {
              email: customer.email,
            })
          )

          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="edit-customer-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col" data-testid="edit-customer-form-keybound">
        <RouteDrawer.Body data-testid="edit-customer-form-body">
          <div className="flex flex-col gap-y-4" data-testid="edit-customer-form-fields">
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="edit-customer-form-email-item">
                    <Form.Label data-testid="edit-customer-form-email-label">{t("fields.email")}</Form.Label>
                    <Form.Control data-testid="edit-customer-form-email-control">
                      <ConditionalTooltip
                        showTooltip={customer.has_account}
                        content={t("customers.edit.emailDisabledTooltip")}
                      >
                        <Input {...field} disabled={customer.has_account} data-testid="edit-customer-form-email-input" />
                      </ConditionalTooltip>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="edit-customer-form-email-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="first_name"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="edit-customer-form-first-name-item">
                    <Form.Label data-testid="edit-customer-form-first-name-label">{t("fields.firstName")}</Form.Label>
                    <Form.Control data-testid="edit-customer-form-first-name-control">
                      <Input {...field} data-testid="edit-customer-form-first-name-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="edit-customer-form-first-name-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="last_name"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="edit-customer-form-last-name-item">
                    <Form.Label data-testid="edit-customer-form-last-name-label">{t("fields.lastName")}</Form.Label>
                    <Form.Control data-testid="edit-customer-form-last-name-control">
                      <Input {...field} data-testid="edit-customer-form-last-name-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="edit-customer-form-last-name-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="company_name"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="edit-customer-form-company-name-item">
                    <Form.Label data-testid="edit-customer-form-company-name-label">{t("fields.company")}</Form.Label>
                    <Form.Control data-testid="edit-customer-form-company-name-control">
                      <Input {...field} data-testid="edit-customer-form-company-name-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="edit-customer-form-company-name-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="phone"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="edit-customer-form-phone-item">
                    <Form.Label data-testid="edit-customer-form-phone-label">{t("fields.phone")}</Form.Label>
                    <Form.Control data-testid="edit-customer-form-phone-control">
                      <Input {...field} data-testid="edit-customer-form-phone-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="edit-customer-form-phone-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="edit-customer-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="edit-customer-form-footer-actions">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" data-testid="edit-customer-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              data-testid="edit-customer-form-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
