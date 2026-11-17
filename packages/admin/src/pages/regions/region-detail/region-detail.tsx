import { useLoaderData, useParams } from "react-router-dom";

import { useRegion } from "../../../hooks/api/regions";
import { RegionCountrySection } from "./components/region-country-section";
import { RegionGeneralSection } from "./components/region-general-section";
import { RegionSellerSection } from "./components/region-seller-section";
import { regionLoader } from "./loader";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
  isForbidden,
  useCan,
} from "@mercurjs/dashboard-shared";
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton";
import { usePricePreferences } from "../../../hooks/api/price-preferences";
import { REGION_DETAIL_FIELDS } from "./constants";

export const RegionDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof regionLoader>
  >

  const { id } = useParams()
  const canViewPreferences = useCan("price_preferences")
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
    }
  )

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
    { enabled: !!region && canViewPreferences }
  )

  const preferencesForbidden =
    !canViewPreferences || isForbidden(preferencesError)

  if (
    isLoading ||
    (!preferencesForbidden && isLoadingPreferences) ||
    !region
  ) {
    return <SingleColumnPageSkeleton sections={3} showJSON showMetadata />
  }

  if (isRegionError) {
    throw regionError
  }

  if (isPreferencesError && !preferencesForbidden) {
    throw preferencesError
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
                pricePreferences={
                  preferencesForbidden ? undefined : (pricePreferences ?? [])
                }
              />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="RegionCountrySection">
              <RegionCountrySection region={region} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="RegionSellerSection">
              <RegionSellerSection region={region} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(region)}
          </>
        ),
      }}
    />
  );
};
