import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useShippingOption } from "@hooks/api/shipping-options"
import { EditShippingOptionsPricingForm } from "./_components/edit-shipping-options-pricing-form"

function LocationServiceZoneShippingOptionPricing() {
  const { t } = useTranslation()
  const { so_id, location_id } = useParams()

  if (!so_id) {
    throw new Response(
      JSON.stringify({ message: t("validation.shippingOptionIdMissing") }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )
  }

  const {
    shipping_option: shippingOption,
    isError,
    error,
  } = useShippingOption(so_id, {
    fields: "*prices,*prices.price_rules",
  })

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal prev={`/settings/locations/${location_id}`}>
      {shippingOption && (
        <EditShippingOptionsPricingForm shippingOption={shippingOption} />
      )}
    </RouteFocusModal>
  )
}

export const Component = LocationServiceZoneShippingOptionPricing
