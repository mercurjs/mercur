import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { SectionNoAccess, isForbidden, useCan } from "@mercurjs/dashboard-shared"
import { RouteDrawer } from "@components/modals"
import { useShippingOptions } from "@hooks/api/shipping-options"
import { EditShippingOptionForm } from "./_components/edit-shipping-option-form"
import { FulfillmentSetType } from "@pages/settings/locations/_common/constants"

const LocationServiceZoneShippingOptionEdit = () => {
  const { t } = useTranslation()

  const { location_id, so_id } = useParams()

  const canViewShippingOptions = useCan("shipping_options")

  const { shipping_options, isPending, isFetching, isError, error } =
    useShippingOptions({
      fields: "+service_zone.fulfillment_set.type",
    })

  const isNoAccess = !canViewShippingOptions || isForbidden(error)

  const shippingOption = shipping_options?.find((so) => so?.id === so_id)

  if (!isNoAccess && !isPending && !isFetching && !shippingOption) {
    throw new Response(
      JSON.stringify({
        message: `Shipping option with ID ${so_id} was not found`,
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )
  }

  if (isError && !isNoAccess) {
    throw error
  }

  const isPickup =
    shippingOption?.service_zone.fulfillment_set.type ===
    FulfillmentSetType.Pickup

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {t(
              `stockLocations.${isPickup ? "pickupOptions" : "shippingOptions"}.edit.header`
            )}
          </Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {isNoAccess && <SectionNoAccess />}
      {shippingOption && (
        <EditShippingOptionForm
          shippingOption={shippingOption}
          locationId={location_id!}
          type={
            shippingOption.service_zone.fulfillment_set
              .type as FulfillmentSetType
          }
        />
      )}
    </RouteDrawer>
  )
}

export const Component = LocationServiceZoneShippingOptionEdit
