import { useLoaderData, useParams } from "react-router-dom"

import { useStockLocation } from "@hooks/api/stock-locations"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { LocationGeneralSection } from "@pages/settings/locations/location-detail/components/location-general-section"
import LocationsSalesChannelsSection from "@pages/settings/locations/location-detail/components/location-sales-channels-section/locations-sales-channels-section"
import LocationsFulfillmentProvidersSection from "@pages/settings/locations/location-detail/components/location-fulfillment-providers-section/location-fulfillment-providers-section"

import { LOCATION_DETAILS_FIELD } from "../_common/constants"
import { locationLoader } from "./loader"

const LocationDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof locationLoader>
  >

  const { location_id } = useParams()
  const {
    stock_location: location,
    isPending: isLoading,
    isError,
    error,
  } = useStockLocation(
    location_id!,
    { fields: LOCATION_DETAILS_FIELD },
    { initialData }
  )

  const { getWidgets } = useExtension()

  if (isLoading || !location) {
    return (
      <TwoColumnPageSkeleton mainSections={3} sidebarSections={2} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("location.details.after"),
        before: getWidgets("location.details.before"),
        sideAfter: getWidgets("location.details.side.after"),
        sideBefore: getWidgets("location.details.side.before"),
      }}
      data={location}
      showJSON
      hasOutlet
      data-testid="location-detail-page"
    >
      <TwoColumnPage.Main data-testid="location-detail-main">
        <LocationGeneralSection location={location} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar data-testid="location-detail-sidebar">
        <LocationsSalesChannelsSection location={location} />
        <LocationsFulfillmentProvidersSection location={location} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const Component = LocationDetail
export { locationLoader as loader } from "./loader"
export { LocationDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
