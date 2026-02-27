import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton";
import { SingleColumnPage } from "../../../components/layout/pages";
import { useCommissionRate } from "../../../hooks/api/commission-rates";
import { CommissionRateGeneralSection } from "./components/commission-rate-general-section";
import { commissionRateLoader } from "./loader";

export const CommissionRateDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof commissionRateLoader>
  >;

  const { id } = useParams();
  const {
    commission_rate,
    isPending: isLoading,
    isError,
    error,
  } = useCommissionRate(id!, { fields: "*rules" }, { initialData });

  if (isLoading || !commission_rate) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage data={commission_rate} showJSON showMetadata>
      <CommissionRateGeneralSection commissionRate={commission_rate} />
    </SingleColumnPage>
  );
};
