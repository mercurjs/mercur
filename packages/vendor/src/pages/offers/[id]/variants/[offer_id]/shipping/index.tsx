import { zodResolver } from "@hookform/resolvers/zod"
import { usePermissionGate } from "@mercurjs/dashboard-shared"
import { ConditionalTooltip } from "@components/common/conditional-tooltip"
import { Button, Heading, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { z } from "zod"

import { Form } from "../../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { useShippingProfiles } from "../../../../../../hooks/api/shipping-profiles"
import { useOffer, useUpdateOffer } from "../../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../../common/constants"
import {
  ShippingProfileSelect,
  toShippingProfilePayload,
} from "../../../../common/components/shipping-profile-select"
import { OfferDetail } from "../../../../common/types"

const Schema = z.object({ shipping_profile_id: z.string() })
type Values = z.infer<typeof Schema>

const EditShippingForm = ({ offer }: { offer: OfferDetail }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const profilesGate = usePermissionGate("shipping_profiles:view")
  const { shipping_profiles } = useShippingProfiles(
    { limit: 1000 },
    { enabled: profilesGate.allowed }
  )

  const form = useForm<Values>({
    defaultValues: { shipping_profile_id: offer.shipping_profile_id ?? "" },
    resolver: zodResolver(Schema),
  })
  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = toShippingProfilePayload(
      values.shipping_profile_id,
      offer.shipping_profile_id,
    )

    if (!("shipping_profile_id" in payload)) {
      handleSuccess()
      return
    }

    await mutateAsync(
      payload,
      {
        onSuccess: () => {
          toast.success(t("offers.variant.shipping.successToast"))
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
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("offers.fields.shippingProfile")}
                </Form.Label>
                <ConditionalTooltip
                  showTooltip={profilesGate.denied}
                  content={profilesGate.tooltip}
                >
                  <div>
                    <Form.Control>
                      <ShippingProfileSelect
                        {...field}
                        profiles={shipping_profiles ?? []}
                        disabled={profilesGate.denied}
                        data-testid="offer-variant-shipping-select"
                      />
                    </Form.Control>
                  </div>
                </ConditionalTooltip>
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
