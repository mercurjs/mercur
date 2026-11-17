import { useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared";
import { useTaxRegion } from "../../../hooks/api/tax-regions";
import { TaxRegionDetailSection } from "./components/tax-region-detail-section";
import { TaxRegionProvinceSection } from "./components/tax-region-province-section";

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton";
import { TaxRegionOverrideSection } from "./components/tax-region-override-section";
import { TaxRegionSublevelAlert } from "./components/tax-region-sublevel-alert";
import { TaxRegionProviderSection } from "./tax-region-provider-section";
import { taxRegionLoader } from "./loader";

export const TaxRegionDetailPage = () => {
  const { id } = useParams();
  const [showSublevelRegions, setShowSublevelRegions] = useState(false);

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof taxRegionLoader>
  >

  const {
    tax_region: taxRegion,
    isLoading,
    isError,
    error,
  } = useTaxRegion(id!, undefined, { initialData })

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={4} showJSON />
  }

  if (isError) {
    throw error
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="tax-regions.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={taxRegion}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="TaxRegionSublevelAlert">
              <TaxRegionSublevelAlert
                taxRegion={taxRegion}
                showSublevelRegions={showSublevelRegions}
                setShowSublevelRegions={setShowSublevelRegions}
              />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="TaxRegionDetailSection">
              <TaxRegionDetailSection taxRegion={taxRegion} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="TaxRegionProvinceSection">
              <TaxRegionProvinceSection
                taxRegion={taxRegion}
                showSublevelRegions={showSublevelRegions}
              />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="TaxRegionOverrideSection">
              <TaxRegionOverrideSection taxRegion={taxRegion} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="TaxRegionProviderSection">
              <TaxRegionProviderSection taxRegion={taxRegion} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(taxRegion)}
          </>
        ),
      }}
    />
  );
};
