import { useLoaderData, useParams } from "react-router-dom";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  detailPageDefaultEntries,
  LayoutComposer,
  useCan,
} from "@mercurjs/dashboard-shared";

import { useRegion } from "@hooks/api/regions";
import { RegionCountrySection } from "./_components/region-country-section";
import { RegionGeneralSection } from "./_components/region-general-section";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { usePricePreferences } from "@hooks/api/price-preferences";
import { REGION_DETAIL_FIELDS } from "./constants";

export { regionLoader as loader } from "./loader";
export { RegionDetailBreadcrumb as Breadcrumb } from "./breadcrumb";

const RegionDetail = () => {
  const initialData = useLoaderData() as any;

  const { id } = useParams();
  const canViewPreferences = useCan("price_preferences");
  const {
    region,
    isPending: isLoading,
    isError: isRegionError,
    error: regionError,
  } = useRegion(
    id!,
    { fields: REGION_DETAIL_FIELDS },
    {
      initialData,
    },
  );

  const {
    price_preferences: pricePreferences,
    isPending: isLoadingPreferences,
    isError: isPreferencesError,
    error: preferencesError,
  } = usePricePreferences(
    {
      attribute: "region_id",
      value: id,
    },
    { enabled: !!region && canViewPreferences },
  );

  if (isLoading || (canViewPreferences && isLoadingPreferences) || !region) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isRegionError) {
    throw regionError;
  }

  if (isPreferencesError) {
    throw preferencesError;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="regions.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={region}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="RegionGeneralSection">
              <RegionGeneralSection
                region={region}
                pricePreferences={pricePreferences ?? []}
              />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="RegionCountrySection">
              <RegionCountrySection region={region} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(region)}
          </>
        ),
      }}
    />
  );
};

export const Component = RegionDetail;
