import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import * as zod from "zod"
import { Form } from "../../../../../components/common/form"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateCustomerAddress } from "../../../../../hooks/api/customers"

const CreateCustomerAddressSchema = zod.object({
  address_name: zod.string().min(1),
  address_1: zod.string().min(1),
  address_2: zod.string().optional(),
  country_code: zod.string().min(2).max(2),
  city: zod.string().optional(),
  postal_code: zod.string().optional(),
  province: zod.string().optional(),
  company: zod.string().optional(),
  phone: zod.string().optional(),
})

export const CreateCustomerAddressForm = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof CreateCustomerAddressSchema>>({
    defaultValues: {
      address_name: "",
      address_1: "",
      address_2: "",
      city: "",
      company: "",
      country_code: "",
      phone: "",
      postal_code: "",
      province: "",
    },
    resolver: zodResolver(CreateCustomerAddressSchema),
  })

  const { mutateAsync, isPending } = useCreateCustomerAddress(id!)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        address_name: values.address_name,
        address_1: values.address_1,
        address_2: values.address_2,
        country_code: values.country_code,
        city: values.city,
        postal_code: values.postal_code,
        province: values.province,
        company: values.company,
        phone: values.phone,
      },
      {
        onSuccess: () => {
          toast.success(t("customers.addresses.create.successToast"))

          handleSuccess(`/customers/${id}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="create-customer-address-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
        data-testid="create-customer-address-form-keybound"
      >
        <RouteFocusModal.Header data-testid="create-customer-address-form-header" />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden" data-testid="create-customer-address-form-body">
          <div className="flex flex-1 flex-col items-center overflow-y-auto" data-testid="create-customer-address-form-body-content">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16" data-testid="create-customer-address-form-content">
              <div data-testid="create-customer-address-form-header-section">
                <Heading className="capitalize" data-testid="create-customer-address-form-title">
                  {t("customers.addresses.create.header")}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle" data-testid="create-customer-address-form-hint">
                  {t("customers.addresses.create.hint")}
                </Text>
              </div>
              <div className="grid grid-cols-2 gap-4" data-testid="create-customer-address-form-fields-row-1">
                <Form.Field
                  control={form.control}
                  name="address_name"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-address-name-item">
                        <Form.Label data-testid="create-customer-address-form-address-name-label">
                          {t("customers.addresses.fields.addressName")}
                        </Form.Label>
                        <Form.Control data-testid="create-customer-address-form-address-name-control">
                          <Input
                            size="small"
                            autoComplete="address_name"
                            {...field}
                            data-testid="create-customer-address-form-address-name-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-address-name-error" />
                      </Form.Item>
                    )
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4" data-testid="create-customer-address-form-fields-row-2">
                <Form.Field
                  control={form.control}
                  name="address_1"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-address-1-item">
                        <Form.Label data-testid="create-customer-address-form-address-1-label">{t("fields.address")}</Form.Label>
                        <Form.Control data-testid="create-customer-address-form-address-1-control">
                          <Input
                            size="small"
                            autoComplete="address_1"
                            {...field}
                            data-testid="create-customer-address-form-address-1-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-address-1-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address_2"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-address-2-item">
                        <Form.Label optional data-testid="create-customer-address-form-address-2-label">{t("fields.address2")}</Form.Label>
                        <Form.Control data-testid="create-customer-address-form-address-2-control">
                          <Input
                            size="small"
                            autoComplete="address_2"
                            {...field}
                            data-testid="create-customer-address-form-address-2-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-address-2-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-postal-code-item">
                        <Form.Label optional data-testid="create-customer-address-form-postal-code-label">
                          {t("fields.postalCode")}
                        </Form.Label>
                        <Form.Control data-testid="create-customer-address-form-postal-code-control">
                          <Input
                            size="small"
                            autoComplete="postal_code"
                            {...field}
                            data-testid="create-customer-address-form-postal-code-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-postal-code-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="city"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-city-item">
                        <Form.Label optional data-testid="create-customer-address-form-city-label">{t("fields.city")}</Form.Label>
                        <Form.Control data-testid="create-customer-address-form-city-control">
                          <Input size="small" autoComplete="city" {...field} data-testid="create-customer-address-form-city-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-city-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="country_code"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-country-code-item">
                        <Form.Label data-testid="create-customer-address-form-country-code-label">{t("fields.country")}</Form.Label>
                        <Form.Control data-testid="create-customer-address-form-country-code-control">
                          <CountrySelect
                            autoComplete="country_code"
                            {...field}
                            data-testid="create-customer-address-form-country-code-select"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-country-code-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="province"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-province-item">
                        <Form.Label optional data-testid="create-customer-address-form-province-label">{t("fields.state")}</Form.Label>
                        <Form.Control data-testid="create-customer-address-form-province-control">
                          <Input
                            size="small"
                            autoComplete="province"
                            {...field}
                            data-testid="create-customer-address-form-province-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-province-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="company"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-company-item">
                        <Form.Label optional data-testid="create-customer-address-form-company-label">{t("fields.company")}</Form.Label>
                        <Form.Control data-testid="create-customer-address-form-company-control">
                          <Input
                            size="small"
                            autoComplete="company"
                            {...field}
                            data-testid="create-customer-address-form-company-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-company-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="phone"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="create-customer-address-form-phone-item">
                        <Form.Label optional data-testid="create-customer-address-form-phone-label">{t("fields.phone")}</Form.Label>
                        <Form.Control data-testid="create-customer-address-form-phone-control">
                          <Input size="small" autoComplete="phone" {...field} data-testid="create-customer-address-form-phone-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="create-customer-address-form-phone-error" />
                      </Form.Item>
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="create-customer-address-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="create-customer-address-form-footer-actions">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" data-testid="create-customer-address-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending} data-testid="create-customer-address-form-submit-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
