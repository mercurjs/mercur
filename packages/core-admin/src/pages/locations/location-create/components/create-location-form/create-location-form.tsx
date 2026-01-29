import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Form } from "../../../../../components/common/form"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateStockLocation } from "../../../../../hooks/api/stock-locations"

const CreateLocationSchema = zod.object({
  name: zod.string().min(1),
  address: zod.object({
    address_1: zod.string().min(1),
    address_2: zod.string().optional(),
    country_code: zod.string().min(2).max(2),
    city: zod.string().optional(),
    postal_code: zod.string().optional(),
    province: zod.string().optional(),
    company: zod.string().optional(),
    phone: zod.string().optional(),
  }),
})

export const CreateLocationForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof CreateLocationSchema>>({
    defaultValues: {
      name: "",
      address: {
        address_1: "",
        address_2: "",
        city: "",
        company: "",
        country_code: "",
        phone: "",
        postal_code: "",
        province: "",
      },
    },
    resolver: zodResolver(CreateLocationSchema),
  })

  const { mutateAsync, isPending } = useCreateStockLocation()

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        address: values.address,
      },
      {
        onSuccess: ({ stock_location }) => {
          toast.success(t("locations.toast.create"))

          handleSuccess(`/settings/locations/${stock_location.id}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="location-create-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header data-testid="location-create-form-header" />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden" data-testid="location-create-form-body">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div data-testid="location-create-form-header-section">
                <Heading className="capitalize" data-testid="location-create-form-heading">
                  {t("stockLocations.create.header")}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle" data-testid="location-create-form-hint">
                  {t("stockLocations.create.hint")}
                </Text>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Field
                  control={form.control}
                  name="name"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-name-item">
                        <Form.Label data-testid="location-create-form-name-label">{t("fields.name")}</Form.Label>
                        <Form.Control data-testid="location-create-form-name-control">
                          <Input size="small" {...field} data-testid="location-create-form-name-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-name-error" />
                      </Form.Item>
                    )
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4" data-testid="location-create-form-address-fields">
                <Form.Field
                  control={form.control}
                  name="address.address_1"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-address-1-item">
                        <Form.Label data-testid="location-create-form-address-1-label">{t("fields.address")}</Form.Label>
                        <Form.Control data-testid="location-create-form-address-1-control">
                          <Input size="small" {...field} data-testid="location-create-form-address-1-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-address-1-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address.address_2"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-address-2-item">
                        <Form.Label optional data-testid="location-create-form-address-2-label">{t("fields.address2")}</Form.Label>
                        <Form.Control data-testid="location-create-form-address-2-control">
                          <Input size="small" {...field} data-testid="location-create-form-address-2-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-address-2-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address.postal_code"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-postal-code-item">
                        <Form.Label optional data-testid="location-create-form-postal-code-label">
                          {t("fields.postalCode")}
                        </Form.Label>
                        <Form.Control data-testid="location-create-form-postal-code-control">
                          <Input size="small" {...field} data-testid="location-create-form-postal-code-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-postal-code-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address.city"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-city-item">
                        <Form.Label optional data-testid="location-create-form-city-label">{t("fields.city")}</Form.Label>
                        <Form.Control data-testid="location-create-form-city-control">
                          <Input size="small" {...field} data-testid="location-create-form-city-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-city-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address.country_code"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-country-item">
                        <Form.Label data-testid="location-create-form-country-label">{t("fields.country")}</Form.Label>
                        <Form.Control data-testid="location-create-form-country-control">
                          <CountrySelect {...field} data-testid="location-create-form-country-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-country-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address.province"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-province-item">
                        <Form.Label optional data-testid="location-create-form-province-label">{t("fields.state")}</Form.Label>
                        <Form.Control data-testid="location-create-form-province-control">
                          <Input size="small" {...field} data-testid="location-create-form-province-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-province-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address.company"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-company-item">
                        <Form.Label optional data-testid="location-create-form-company-label">{t("fields.company")}</Form.Label>
                        <Form.Control data-testid="location-create-form-company-control">
                          <Input size="small" {...field} data-testid="location-create-form-company-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-company-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="address.phone"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="location-create-form-phone-item">
                        <Form.Label optional data-testid="location-create-form-phone-label">{t("fields.phone")}</Form.Label>
                        <Form.Control data-testid="location-create-form-phone-control">
                          <Input size="small" {...field} data-testid="location-create-form-phone-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="location-create-form-phone-error" />
                      </Form.Item>
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="location-create-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" data-testid="location-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending} data-testid="location-create-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
