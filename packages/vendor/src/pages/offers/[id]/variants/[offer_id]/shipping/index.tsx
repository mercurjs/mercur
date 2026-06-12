import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Select, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { z } from "zod"

import { Form } from "../../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { useShippingProfiles } from "../../../../../../hooks/api/shipping-profiles"
import { useOffer, useUpdateOffer } from "../../../../../../hooks/api/offers"
import { useDocumentDirection } from "../../../../../../hooks/use-document-direction"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../../common/constants"
import { OfferDetail } from "../../../../common/types"

const Schema = z.object({ shipping_profile_id: z.string().min(1) })
type Values = z.infer<typeof Schema>

/** Edit Shipping Configuration drawer — a single shipping-profile select. */
const EditShippingForm = ({ offer }: { offer: OfferDetail }) => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const { handleSuccess } = useRouteModal()
  const { shipping_profiles } = useShippingProfiles({ limit: 1000 })

  const form = useForm<Values>({
    defaultValues: { shipping_profile_id: offer.shipping_profile_id ?? "" },
    resolver: zodResolver(Schema),
  })
  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      { shipping_profile_id: values.shipping_profile_id },
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
        data-testid="offer-variant-shipping-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
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
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

export const OfferVariantShippingPage = () => {
  const { offer_id } = useParams()
  const { t } = useTranslation()
  const { offer, isPending, isError, error } = useOffer(offer_id!, {
    fields: OFFER_VARIANT_DETAIL_FIELDS,
  })

  if (isError) throw error
  const ready = !isPending && !!offer

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {`${t("actions.edit")} ${t("offers.detail.shippingConfiguration")}`}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("offers.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditShippingForm offer={offer as OfferDetail} />}
    </RouteDrawer>
  )
}

export const Component = OfferVariantShippingPage
