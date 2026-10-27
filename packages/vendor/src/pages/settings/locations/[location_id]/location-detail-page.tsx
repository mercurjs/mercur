import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";
import { useStockLocation } from "@hooks/api/stock-locations";

import { LocationGeneralSection } from "./_components/location-general-section";
import LocationsFulfillmentProvidersSection from "./_components/location-fulfillment-providers-section";
import { LocationLegacyShippingOptionsSection } from "./_components/location-legacy-shipping-options-section";
import { LocationShippingMethodsSection } from "./_components/location-shipping-methods-section";
import { MissingMandatoryShippingAlert } from "./_components/missing-mandatory-shipping-alert";
import { LOCATION_DETAILS_FIELD } from "./constants";

import type { locationLoader } from "./loader";

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
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />
    );
  }

  if (isError) {
    throw error;
  }

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={location} hasOutlet>
          <TwoColumnPage.Main>
            <WidgetZone id="locations.detail.main" data={location}>
              <MissingMandatoryShippingAlert />
              <LocationGeneralSection location={location} />
              <LocationShippingMethodsSection locationId={location.id} />
              <LocationLegacyShippingOptionsSection locationId={location.id} />
            </WidgetZone>
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <WidgetZone id="locations.detail.side" data={location}>
              <LocationsFulfillmentProvidersSection location={location} />
            </WidgetZone>
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const LocationDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: LocationGeneralSection,
  MainShippingMethodsSection: LocationShippingMethodsSection,
  MainLegacyShippingOptionsSection: LocationLegacyShippingOptionsSection,
  MissingMandatoryShippingAlert,
  SidebarFulfillmentProvidersSection: LocationsFulfillmentProvidersSection,
});
