import { Button, Input, Select, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import {
  ExtendableFormField,
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useShippingProfiles } from "../../../../../hooks/api/shipping-profiles"
import { useUpdateOffer } from "../../../../../hooks/api/offers"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { OfferDetail } from "../../../common/types"
import { EditOfferSchema } from "./schema"

type Props = { offer: OfferDetail }

const BUILT_IN_FIELD_IDS = ["sku", "shipping_profile_id", "leadtime_to_ship"]

export const EditOfferForm = ({ offer }: Props) => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const { handleSuccess } = useRouteModal()

  const { shipping_profiles } = useShippingProfiles({ limit: 1000 })

  const form = useExtendableForm({
    schema: EditOfferSchema,
    model: "offer",
    zone: "edit",
    data: offer,
    builtInFieldIds: BUILT_IN_FIELD_IDS,
    defaultValues: {
      sku: offer.sku ?? "",
      shipping_profile_id: offer.shipping_profile_id ?? "",
      leadtime_to_ship: offer.leadtime_to_ship?.toString() ?? "",
      metadata: offer.metadata ?? null,
    },
  })

  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        sku: values.sku,
        shipping_profile_id: values.shipping_profile_id,
        leadtime_to_ship: values.leadtime_to_ship
          ? Number(values.leadtime_to_ship)
          : null,
        metadata: values.metadata ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("offers.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => toast.error(error.message),
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="offer-edit-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
          <ExtendableFormField
            model="offer"
            zone="edit"
            id="sku"
            control={form.control}
            data={offer}
          >
            <Form.Field
              control={form.control}
              name="sku"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("offers.fields.sku")}</Form.Label>
                  <Form.Control>
                    <Input maxLength={64} autoComplete="off" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </ExtendableFormField>

          <ExtendableFormField
            model="offer"
            zone="edit"
            id="shipping_profile_id"
            control={form.control}
            data={offer}
          >
            <Form.Field
              control={form.control}
              name="shipping_profile_id"
              render={({ field: { ref: _r, onChange, ...f } }) => (
                <Form.Item>
                  <Form.Label>{t("offers.fields.shippingProfile")}</Form.Label>
                  <Form.Control>
                    <Select {...f} onValueChange={onChange} dir={dir}>
                      <Select.Trigger ref={_r}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {(shipping_profiles ?? []).map((p) => (
                          <Select.Item key={p.id} value={p.id}>
                            {p.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </ExtendableFormField>

          <ExtendableFormField
            model="offer"
            zone="edit"
            id="leadtime_to_ship"
            control={form.control}
            data={offer}
          >
            <Form.Field
              control={form.control}
              name="leadtime_to_ship"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("offers.fields.leadtime")}</Form.Label>
                  <Form.Control>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      placeholder={t("offers.fields.storeDefault")}
                      {...field}
                      data-testid="offer-edit-form-leadtime-input"
                    />
                  </Form.Control>
                  <Form.Hint>{t("offers.fields.leadtimeHint")}</Form.Hint>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </ExtendableFormField>

          <FormExtensionZone
            model="offer"
            zone="edit"
            control={form.control}
            data={offer}
            builtInFieldIds={BUILT_IN_FIELD_IDS}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
