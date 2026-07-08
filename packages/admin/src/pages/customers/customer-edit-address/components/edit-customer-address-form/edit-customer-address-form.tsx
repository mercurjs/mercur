import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import i18n from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateCustomerAddress } from "../../../../../hooks/api/customers"

const EditCustomerAddressSchema = zod.object({
  address_name: zod.string().min(1, {
    message: i18n.t("customers.addresses.validation.addressNameRequired"),
  }),
  address_1: zod.string().min(1, {
    message: i18n.t("customers.addresses.validation.addressRequired"),
  }),
  address_2: zod.string().optional(),
  country_code: zod
    .string()
    .min(2, { message: i18n.t("customers.addresses.validation.countryRequired") })
    .max(2),
  city: zod.string().optional(),
  postal_code: zod.string().optional(),
  province: zod.string().optional(),
  company: zod.string().optional(),
  phone: zod.string().optional(),
})

export const EditCustomerAddressForm = ({
  customerId,
  address,
}: {
  customerId: string
  address: HttpTypes.AdminCustomerAddress
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditCustomerAddressSchema>>({
    defaultValues: {
      address_name: address.address_name ?? "",
      address_1: address.address_1 ?? "",
      address_2: address.address_2 ?? "",
      city: address.city ?? "",
      company: address.company ?? "",
      country_code: address.country_code ?? "",
      phone: address.phone ?? "",
      postal_code: address.postal_code ?? "",
      province: address.province ?? "",
    },
    resolver: zodResolver(EditCustomerAddressSchema),
  })

  const { mutateAsync, isPending } = useUpdateCustomerAddress(
    customerId,
    address.id
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values, {
      onSuccess: () => {
        toast.success(t("customers.addresses.edit.successToast"))

        handleSuccess(`/customers/${customerId}`)
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="edit-customer-address-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col"
        data-testid="edit-customer-address-form-keybound"
      >
        <RouteDrawer.Body data-testid="edit-customer-address-form-body">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="address_name"
              render={({ field }) => (
                <Form.Item data-testid="edit-customer-address-form-address-name-item">
                  <Form.Label>
                    {t("customers.addresses.fields.addressName")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      size="small"
                      autoComplete="off"
                      {...field}
                      data-testid="edit-customer-address-form-address-name-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <div className="grid grid-cols-1 gap-4">
              <Form.Field
                control={form.control}
                name="address_1"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-address-1-item">
                    <Form.Label>{t("fields.address")}</Form.Label>
                    <Form.Control>
                      <Input
                        size="small"
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-address-1-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="address_2"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-address-2-item">
                    <Form.Label optional>{t("fields.address2")}</Form.Label>
                    <Form.Control>
                      <Input
                        size="small"
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-address-2-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-postal-code-item">
                    <Form.Label optional>{t("fields.postalCode")}</Form.Label>
                    <Form.Control>
                      <Input
                        size="small"
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-postal-code-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="city"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-city-item">
                    <Form.Label optional>{t("fields.city")}</Form.Label>
                    <Form.Control>
                      <Input
                        size="small"
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-city-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="country_code"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-country-code-item">
                    <Form.Label>{t("fields.country")}</Form.Label>
                    <Form.Control>
                      <CountrySelect
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-country-code-select"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="province"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-province-item">
                    <Form.Label optional>{t("fields.state")}</Form.Label>
                    <Form.Control>
                      <Input
                        size="small"
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-province-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="company"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-company-item">
                    <Form.Label optional>{t("fields.company")}</Form.Label>
                    <Form.Control>
                      <Input
                        size="small"
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-company-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <Form.Item data-testid="edit-customer-address-form-phone-item">
                    <Form.Label optional>{t("fields.phone")}</Form.Label>
                    <Form.Control>
                      <Input
                        size="small"
                        autoComplete="off"
                        {...field}
                        data-testid="edit-customer-address-form-phone-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="edit-customer-address-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="edit-customer-address-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
