import { ShoppingBag } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useLoaderData } from "react-router-dom"

import { useStockLocations } from "@hooks/api/stock-locations"
import LocationListItem from "./_components/location-list-item"
import { LOCATION_LIST_FIELDS } from "./constants"
import { shippingListLoader } from "./loader"

import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { LocationListHeader } from "./_components/location-list-header"
import { SidebarLink } from "@components/common/sidebar-link/sidebar-link"

function LocationList() {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingListLoader>
  >

  const {
    stock_locations: stockLocations = [],
    isError,
    error,
  } = useStockLocations(
    {
      fields: LOCATION_LIST_FIELDS,
    },
    { initialData }
  )

  const { getWidgets } = useDashboardExtension()

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
    >
      <TwoColumnPage.Main>
        <LocationListHeader />
        <div className="flex flex-col gap-3 lg:col-span-2">
          {stockLocations.map((location) => (
            <LocationListItem key={location.id} location={location} />
          ))}
        </div>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <LinksSection />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

const LinksSection = () => {
  const { t } = useTranslation()

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("stockLocations.sidebar.header")}</Heading>
      </div>

      <SidebarLink
        to="/settings/locations/shipping-profiles"
        labelKey={t("stockLocations.sidebar.shippingProfiles.label")}
        descriptionKey={t(
          "stockLocations.sidebar.shippingProfiles.description"
        )}
        icon={<ShoppingBag />}
      />
    </Container>
  )
}

export const Component = LocationList
export { shippingListLoader as loader } from "./loader"
