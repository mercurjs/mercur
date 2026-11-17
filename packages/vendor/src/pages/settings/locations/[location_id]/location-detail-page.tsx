import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import { LayoutComposer } from "@mercurjs/dashboard-shared";
import { useStockLocation } from "@hooks/api/stock-locations";

import { LocationGeneralSection } from "./_components/location-general-section";
import LocationsFulfillmentProvidersSection from "./_components/location-fulfillment-providers-section";
import { LOCATION_DETAILS_FIELD } from "./constants";

import type { locationLoader } from "./loader";

export const LocationDetailPage = () => {
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
    <LayoutComposer
      widgetsZonePrefix="locations.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={location}
      sections={{
        main: (
          <LayoutComposer.Entry id="LocationGeneralSection">
            <LocationGeneralSection location={location} />
          </LayoutComposer.Entry>
        ),
        side: (
          <LayoutComposer.Entry id="LocationsFulfillmentProvidersSection">
            <LocationsFulfillmentProvidersSection location={location} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
