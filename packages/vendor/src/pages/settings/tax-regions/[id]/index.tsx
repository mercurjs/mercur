import { useLoaderData, useParams } from "react-router-dom";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import { LayoutComposer } from "@mercurjs/dashboard-shared";

import { useTaxRegion } from "@hooks/api/tax-regions";
import { TaxRegionDetailSection } from "./_components/tax-region-detail-section";
import { TaxRegionProvinceSection } from "./_components/tax-region-province-section";

import { useState } from "react";
import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { TaxRegionOverrideSection } from "./_components/tax-region-override-section";
import { TaxRegionSublevelAlert } from "./_components/tax-region-sublevel-alert";
import { taxRegionLoader } from "./loader";

const TaxRegionDetail = () => {
  const { id } = useParams();
  const [showSublevelRegions, setShowSublevelRegions] = useState(false);

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof taxRegionLoader>
  >;

  const {
    tax_region: taxRegion,
    isLoading,
    isError,
    error,
  } = useTaxRegion(id!, undefined, { initialData });

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={4} />;
  }

  if (isError) {
    throw error;
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
          </>
        ),
      }}
    />
  );
};

export const Component = TaxRegionDetail;
export { taxRegionLoader as loader } from "./loader";
export { TaxRegionDetailBreadcrumb as Breadcrumb } from "./breadcrumb";
