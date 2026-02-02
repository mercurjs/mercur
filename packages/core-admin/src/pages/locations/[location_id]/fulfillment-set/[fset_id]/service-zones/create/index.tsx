import { json, useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useStockLocation } from "@hooks/api/stock-locations"
import { CreateServiceZoneForm } from "@pages/locations/location-service-zone-create/components/create-service-zone-form"
import { FulfillmentSetType } from "@pages/locations/_common/constants"

const LocationCreateServiceZone = () => {
  const { fset_id, location_id } = useParams()

  const { stock_location, isPending, isFetching, isError, error } =
    useStockLocation(location_id!, {
      fields: "*fulfillment_sets",
    })

  const fulfillmentSet = stock_location?.fulfillment_sets?.find(
    (f) => f.id === fset_id
  )

  const type: FulfillmentSetType =
    fulfillmentSet?.type === FulfillmentSetType.Pickup
      ? FulfillmentSetType.Pickup
      : FulfillmentSetType.Shipping

  if (!isPending && !isFetching && !fulfillmentSet) {
    throw json(
      { message: `Fulfillment set with ID: ${fset_id} was not found.` },
      404
    )
  }

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal prev={`/settings/locations/${location_id}`} data-testid="location-service-zone-create-modal">
      {fulfillmentSet && (
        <CreateServiceZoneForm
          fulfillmentSet={fulfillmentSet}
          location={stock_location!}
          type={type}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = LocationCreateServiceZone
