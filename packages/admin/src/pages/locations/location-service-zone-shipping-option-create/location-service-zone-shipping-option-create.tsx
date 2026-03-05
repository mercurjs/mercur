import { Children, ReactNode } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form"
import { useStockLocation } from "../../../hooks/api/stock-locations"
import { FulfillmentSetType } from "../common/constants"
import {
  CreateShippingOptionsForm,
  CreateShippingOptionSchemaType,
} from "./components/create-shipping-options-form"
import { CreateShippingOptionDetailsForm } from "./components/create-shipping-options-form/create-shipping-option-details-form"
import { CreateShippingOptionsPricesForm } from "./components/create-shipping-options-form/create-shipping-options-prices-form"
import { CreateShippingOptionSchema } from "./components/create-shipping-options-form/schema"
import { LOC_CREATE_SHIPPING_OPTION_FIELDS } from "./constants"

const Root = ({ children }: { children?: ReactNode }) => {
  const { location_id, fset_id, zone_id } = useParams()
  const [searchParams] = useSearchParams()
  const isReturn = searchParams.has("is_return")

  const { stock_location, isPending, isFetching, isError, error } =
    useStockLocation(location_id!, {
      fields: LOC_CREATE_SHIPPING_OPTION_FIELDS,
    })

  const fulfillmentSet = stock_location?.fulfillment_sets?.find(
    (f) => f.id === fset_id
  )

  if (!isPending && !isFetching && !fulfillmentSet) {
    throw new Response(
      JSON.stringify({ message: `Fulfillment set with ID ${fset_id} was not found` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )
  }

  const zone = fulfillmentSet?.service_zones?.find((z) => z.id === zone_id)

  if (!isPending && !isFetching && !zone) {
    throw new Response(
      JSON.stringify({ message: `Service zone with ID ${zone_id} was not found` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )
  }

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal prev={`/settings/locations/${location_id}`} data-testid="location-shipping-option-create-modal">
      {zone && (
        Children.count(children) > 0 ? (
          children
        ) : (
          <CreateShippingOptionsForm
            zone={zone}
            isReturn={isReturn}
            locationId={location_id!}
            type={fulfillmentSet!.type as FulfillmentSetType}
          />
        )
      )}
    </RouteFocusModal>
  )
}

export const ShippingOptionCreatePage = Object.assign(Root, {
  Form: CreateShippingOptionsForm,
  DetailsTab: CreateShippingOptionDetailsForm,
  PricingTab: CreateShippingOptionsPricesForm,
  Tab: TabbedForm.Tab,
})

export type { CreateShippingOptionSchemaType }
export { CreateShippingOptionSchema }

// Keep backward-compatible named export for route `Component`
export const LocationServiceZoneShippingOptionCreate = Root
