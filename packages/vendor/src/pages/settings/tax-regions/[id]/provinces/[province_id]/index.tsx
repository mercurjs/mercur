import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPage } from "@components/layout/pages";
import { useTaxRegion } from "@hooks/api/tax-regions";
import { TaxRegionProvinceDetailSection } from "./_components/tax-region-detail-section";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { TaxRegionProvinceOverrideSection } from "./_components/tax-region-province-override-section";
import { taxRegionLoader } from "./loader";

const TaxRegionProvinceDetail = () => {
  const { province_id } = useParams();

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof taxRegionLoader>
  >;

  const {
    tax_region: taxRegion,
    isLoading,
    isError,
    error,
  } = useTaxRegion(province_id!, undefined, {
    initialData,
  });

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage data={taxRegion}>
      <TaxRegionProvinceDetailSection taxRegion={taxRegion} />
      <TaxRegionProvinceOverrideSection taxRegion={taxRegion} />
    </SingleColumnPage>
  );
};

export const Component = TaxRegionProvinceDetail;
export { taxRegionLoader as loader } from "./loader";
export { TaxRegionDetailBreadcrumb as Breadcrumb } from "./breadcrumb";
