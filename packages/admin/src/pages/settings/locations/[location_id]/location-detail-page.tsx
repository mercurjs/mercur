import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useStockLocation } from "@hooks/api/stock-locations";

import { LocationGeneralSection } from "./_components/location-general-section";
import LocationsFulfillmentProvidersSection from "./_components/location-fulfillment-providers-section";
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
      <TwoColumnPageSkeleton mainSections={3} sidebarSections={2} showJSON />
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
            <LocationGeneralSection location={location} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <LocationsFulfillmentProvidersSection location={location} />
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
  SidebarFulfillmentProvidersSection: LocationsFulfillmentProvidersSection,
});
