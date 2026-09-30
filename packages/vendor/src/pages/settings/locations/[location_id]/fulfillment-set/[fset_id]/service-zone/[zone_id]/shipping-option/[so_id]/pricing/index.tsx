import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { SectionNoAccess, isForbidden, useCan } from "@mercurjs/dashboard-shared"
import { RouteFocusModal } from "@components/modals"
import { useShippingOption } from "@hooks/api/shipping-options"
import { EditShippingOptionsPricingForm } from "./_components/edit-shipping-options-pricing-form"

function LocationServiceZoneShippingOptionPricing() {
  const { t } = useTranslation()
  const { so_id, location_id } = useParams()
  const canViewShippingOptions = useCan("shipping_options")

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
  } = useShippingOption(
    so_id,
    {
      fields: "*prices,*prices.price_rules",
    },
    { enabled: canViewShippingOptions }
  )

  const isNoAccess = !canViewShippingOptions || isForbidden(error)

  if (isError && !isNoAccess) {
    throw error
  }

  return (
    <RouteFocusModal prev={`/settings/locations/${location_id}`}>
      {isNoAccess && <SectionNoAccess />}
      {shippingOption && (
        <EditShippingOptionsPricingForm shippingOption={shippingOption} />
      )}
    </RouteFocusModal>
  )
}

export const Component = LocationServiceZoneShippingOptionPricing
