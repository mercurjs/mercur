import { SectionNoAccess, isForbidden, useCan } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { useShippingOption } from "../../../hooks/api/shipping-options"
import { EditShippingOptionsPricingForm } from "./components/create-shipping-options-form"

export function LocationServiceZoneShippingOptionPricing() {
  const { t } = useTranslation()
  const { so_id, location_id } = useParams()

  if (!so_id) {
    throw new Response(
      JSON.stringify({ message: t("validation.shippingOptionIdMissing") }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )
  }

  const canViewShippingOptions = useCan("shipping_options")
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

  const forbidden = !canViewShippingOptions || isForbidden(error)

  if (isError && !forbidden) {
    throw error
  }

  return (
    <RouteFocusModal prev={`/settings/locations/${location_id}`} data-testid="location-shipping-option-pricing-modal">
      {forbidden && (
        <>
          <RouteFocusModal.Header />
          <RouteFocusModal.Body>
            <SectionNoAccess />
          </RouteFocusModal.Body>
        </>
      )}
      {!forbidden && shippingOption && (
        <EditShippingOptionsPricingForm shippingOption={shippingOption} />
      )}
    </RouteFocusModal>
  )
}
