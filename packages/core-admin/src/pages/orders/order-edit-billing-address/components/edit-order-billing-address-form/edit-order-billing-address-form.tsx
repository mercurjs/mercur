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
import { CountrySelect } from "../../../../../components/inputs/country-select"

type EditOrderBillingAddressFormProps = {
  order: HttpTypes.AdminOrder
}

const EditOrderBillingAddressSchema = zod.object({
  address_1: zod.string().min(1),
  address_2: zod.string().optional(),
  country_code: zod.string().min(2).max(2),
  city: zod.string().optional(),
  postal_code: zod.string().optional(),
  province: zod.string().optional(),
  company: zod.string().optional(),
  phone: zod.string().optional(),
})

export function EditOrderBillingAddressForm({
  order,
}: EditOrderBillingAddressFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditOrderBillingAddressSchema>>({
    defaultValues: {
      address_1: order.billing_address?.address_1 || "",
      address_2: order.billing_address?.address_2 || "",
      city: order.billing_address?.city || "",
      company: order.billing_address?.company || "",
      country_code: order.billing_address?.country_code || "",
      phone: order.billing_address?.phone || "",
      postal_code: order.billing_address?.postal_code || "",
      province: order.billing_address?.province || "",
    },
    resolver: zodResolver(EditOrderBillingAddressSchema),
  })

  const { mutateAsync, isPending } = useUpdateOrder(order.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await mutateAsync({
        billing_address: data,
      })
      toast.success(t("orders.edit.billingAddress.requestSuccess"))
      handleSuccess()
    } catch (error) {
      toast.error((error as Error).message)
    }
  })

  return (
    <RouteDrawer.Form form={form} data-testid="order-edit-billing-address-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex-1 overflow-auto" data-testid="order-edit-billing-address-body">
          <div className="flex flex-col gap-4">
            <Form.Field
              control={form.control}
              name="address_1"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-address1-item">
                    <Form.Label data-testid="order-edit-billing-address-address1-label">{t("fields.address")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-address1-control">
                      <Input size="small" {...field} data-testid="order-edit-billing-address-address1-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-address1-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="address_2"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-address2-item">
                    <Form.Label optional data-testid="order-edit-billing-address-address2-label">{t("fields.address2")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-address2-control">
                      <Input size="small" {...field} data-testid="order-edit-billing-address-address2-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-address2-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="postal_code"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-postal-code-item">
                    <Form.Label optional data-testid="order-edit-billing-address-postal-code-label">{t("fields.postalCode")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-postal-code-control">
                      <Input size="small" {...field} data-testid="order-edit-billing-address-postal-code-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-postal-code-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="city"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-city-item">
                    <Form.Label optional data-testid="order-edit-billing-address-city-label">{t("fields.city")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-city-control">
                      <Input size="small" {...field} data-testid="order-edit-billing-address-city-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-city-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="country_code"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-country-item">
                    <Form.Label data-testid="order-edit-billing-address-country-label">{t("fields.country")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-country-control">
                      <CountrySelect {...field} disabled data-testid="order-edit-billing-address-country-select" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-country-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="province"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-province-item">
                    <Form.Label optional data-testid="order-edit-billing-address-province-label">{t("fields.state")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-province-control">
                      <Input size="small" {...field} data-testid="order-edit-billing-address-province-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-province-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="company"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-company-item">
                    <Form.Label optional data-testid="order-edit-billing-address-company-label">{t("fields.company")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-company-control">
                      <Input size="small" {...field} data-testid="order-edit-billing-address-company-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-company-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="phone"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-edit-billing-address-phone-item">
                    <Form.Label optional data-testid="order-edit-billing-address-phone-label">{t("fields.phone")}</Form.Label>
                    <Form.Control data-testid="order-edit-billing-address-phone-control">
                      <Input size="small" {...field} data-testid="order-edit-billing-address-phone-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="order-edit-billing-address-phone-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="order-edit-billing-address-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" data-testid="order-edit-billing-address-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              disabled={!!Object.keys(form.formState.errors || {}).length}
              data-testid="order-edit-billing-address-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
