import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { Combobox } from "../../../../../components/inputs/combobox"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateShippingZone } from "../../../../../hooks/api/shipping-zones"
import { ZoneProvincesField } from "../../../common/components/zone-provinces-field"
import { buildGeoZones, countryOptions, generateCode } from "../../../common/utils"

const CreateShippingZoneSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  is_active: z.boolean(),
  countries: z.array(z.string()).min(1),
  provinces: z.record(z.string(), z.array(z.string())),
})

type CreateShippingZoneValues = z.infer<typeof CreateShippingZoneSchema>

export const CreateShippingZoneForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<CreateShippingZoneValues>({
    defaultValues: {
      name: "",
      code: "",
      is_active: true,
      countries: [],
      provinces: {},
    },
    resolver: zodResolver(CreateShippingZoneSchema),
  })

  const { mutateAsync, isPending } = useCreateShippingZone()

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        code: values.code,
        is_active: values.is_active,
        geo_zones: buildGeoZones(values.countries, values.provinces),
      },
      {
        onSuccess: ({ shipping_zone }) => {
          toast.success(
            t("shippingZones.create.successToast", {
              name: shipping_zone.name,
            })
          )
          handleSuccess("/settings/locations/shipping-zones")
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="shipping-zone-create-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col items-center overflow-auto p-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div>
              <RouteFocusModal.Title asChild>
                <Heading data-testid="shipping-zone-create-form-heading">
                  {t("shippingZones.create.header")}
                </Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("shippingZones.create.hint")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("shippingZones.fields.name")}</Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="off"
                        {...field}
                        onChange={(e) => {
                          if (!form.getFieldState("code").isDirty) {
                            form.setValue("code", generateCode(e.target.value))
                          }
                          field.onChange(e)
                        }}
                        data-testid="shipping-zone-create-form-name-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label tooltip={t("shippingZones.fields.codeHint")}>
                      {t("shippingZones.fields.code")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="off"
                        {...field}
                        data-testid="shipping-zone-create-form-code-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
            <Form.Field
              control={form.control}
              name="countries"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("shippingZones.fields.countries")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      options={countryOptions}
                      placeholder={t("shippingZones.fields.countriesPlaceholder")}
                      data-testid="shipping-zone-create-form-countries-combobox"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <ZoneProvincesField testId="shipping-zone-create-form" />
            <SwitchBox
              control={form.control}
              name="is_active"
              label={t("shippingZones.fields.active")}
              description={t("shippingZones.fields.activeHint")}
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="shipping-zone-create-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="shipping-zone-create-form-submit-button"
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
