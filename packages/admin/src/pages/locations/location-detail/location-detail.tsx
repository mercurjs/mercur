import { ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { useStockLocation } from "../../../hooks/api/stock-locations";
import { LocationGeneralSection } from "./components/location-general-section";
import LocationsSalesChannelsSection from "./components/location-sales-channels-section/locations-sales-channels-section";
import { locationLoader } from "./loader";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition";
import LocationsFulfillmentProvidersSection from "./components/location-fulfillment-providers-section/location-fulfillment-providers-section";
import { LOCATION_DETAILS_FIELD } from "./constants";

const ALLOWED_TYPES = [TwoColumnPage.Main, TwoColumnPage.Sidebar, LocationGeneralSection, LocationsSalesChannelsSection, LocationsFulfillmentProvidersSection] as const;

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof locationLoader>
  >;

  const { location_id } = useParams();
  const {
    stock_location: location,
    isPending: isLoading,
    isError,
    error,
  } = useStockLocation(
    location_id!,
    { fields: LOCATION_DETAILS_FIELD },
    { initialData },
  );

  if (isLoading || !location) {
    return (
      <TwoColumnPageSkeleton mainSections={3} sidebarSections={2} showJSON />
    );
  }

  if (isError) {
    throw error;
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <TwoColumnPage
      data={location}
      showJSON
      hasOutlet
      data-testid="location-detail-page"
    >
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage
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
  );
};

export const LocationDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: LocationGeneralSection,
  SidebarSalesChannelsSection: LocationsSalesChannelsSection,
  SidebarFulfillmentProvidersSection: LocationsFulfillmentProvidersSection,
});
