import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, toast } from "@medusajs/ui"
import type { ShippingZoneDTO } from "@mercurjs/types"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateShippingZone } from "../../../../../hooks/api/shipping-zones"
import { ZoneProvincesField } from "../../../common/components/zone-provinces-field"
import {
  buildGeoZones,
  countryOptions,
  getZoneCountryCodes,
  getZoneProvinces,
} from "../../../common/utils"

const EditShippingZoneSchema = z.object({
  name: z.string().min(1),
  is_active: z.boolean(),
  countries: z.array(z.string()).min(1),
  provinces: z.record(z.string(), z.array(z.string())),
})

type EditShippingZoneValues = z.infer<typeof EditShippingZoneSchema>

export const EditShippingZoneForm = ({ zone }: { zone: ShippingZoneDTO }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<EditShippingZoneValues>({
    defaultValues: {
      name: zone.name,
      is_active: zone.is_active,
      countries: getZoneCountryCodes(zone),
      provinces: getZoneProvinces(zone),
    },
    resolver: zodResolver(EditShippingZoneSchema),
  })

  const { mutateAsync, isPending } = useUpdateShippingZone(zone.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        is_active: values.is_active,
        geo_zones: buildGeoZones(values.countries, values.provinces),
      },
      {
        onSuccess: ({ shipping_zone }) => {
          toast.success(
            t("shippingZones.edit.successToast", { name: shipping_zone.name })
          )
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-y-4">
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
                      data-testid="shipping-zone-edit-form-name-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
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
                      data-testid="shipping-zone-edit-form-countries-combobox"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <ZoneProvincesField testId="shipping-zone-edit-form" />
            <SwitchBox
              control={form.control}
              name="is_active"
              label={t("shippingZones.fields.active")}
              description={t("shippingZones.fields.activeHint")}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="shipping-zone-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="shipping-zone-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
