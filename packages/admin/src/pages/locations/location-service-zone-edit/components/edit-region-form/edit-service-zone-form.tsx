import { HttpTypes } from "@medusajs/types"
import { Button, InlineTip, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateFulfillmentSetServiceZone } from "../../../../../hooks/api/fulfillment-sets"

type EditServiceZoneFormProps = {
  zone: HttpTypes.AdminServiceZone
  fulfillmentSetId: string
  locationId: string
}

const EditServiceZoneSchema = zod.object({
  name: zod.string().min(1),
})

export const EditServiceZoneForm = ({
  zone,
  fulfillmentSetId,
  locationId,
}: EditServiceZoneFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditServiceZoneSchema>>({
    defaultValues: {
      name: zone.name,
    },
  })

  const { mutateAsync, isPending: isLoading } =
    useUpdateFulfillmentSetServiceZone(fulfillmentSetId, zone.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
      },
      {
        onSuccess: () => {
          toast.success(
            t("stockLocations.serviceZones.edit.successToast", {
              name: values.name,
            })
          )
          handleSuccess(`/settings/locations/${locationId}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="location-service-zone-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex-1 overflow-auto" data-testid="location-service-zone-edit-form-body">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="location-service-zone-edit-form-name-item">
                      <Form.Label data-testid="location-service-zone-edit-form-name-label">{t("fields.name")}</Form.Label>
                      <Form.Control data-testid="location-service-zone-edit-form-name-control">
                        <Input {...field} data-testid="location-service-zone-edit-form-name-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="location-service-zone-edit-form-name-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <InlineTip label={t("general.tip")} data-testid="location-service-zone-edit-form-tip">
              {t("stockLocations.serviceZones.fields.tip")}
            </InlineTip>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="location-service-zone-edit-form-footer">
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="location-service-zone-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isLoading} data-testid="location-service-zone-edit-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
