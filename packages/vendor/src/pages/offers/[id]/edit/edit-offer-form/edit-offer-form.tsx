import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Select, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useShippingProfiles } from "../../../../../hooks/api/shipping-profiles"
import { useUpdateOffer } from "../../../../../hooks/api/offers"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { OfferDetail } from "../../../common/types"
import { EditOfferFormValues, EditOfferSchema } from "./schema"

type Props = { offer: OfferDetail }

export const EditOfferForm = ({ offer }: Props) => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const { handleSuccess } = useRouteModal()

  const { shipping_profiles } = useShippingProfiles({ limit: 1000 })

  const form = useForm<EditOfferFormValues>({
    defaultValues: {
      sku: offer.sku ?? "",
      shipping_profile_id: offer.shipping_profile_id ?? "",
      metadata: offer.metadata ?? null,
    },
    resolver: zodResolver(EditOfferSchema),
  })

  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        sku: values.sku,
        shipping_profile_id: values.shipping_profile_id,
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
