import { UIMatch, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { usePayout } from "@hooks/api/payouts";

import { PayoutGeneralSection } from "./_components/payout-general-section";

export const Breadcrumb = (props: UIMatch) => {
  const { id } = props.params || {};

  const { payout } = usePayout(id!, undefined, {
    enabled: Boolean(id),
  });

  if (!payout) {
    return null;
  }

  return <span>#{payout.display_id}</span>;
};

export const Component = () => {
  const { id } = useParams();

  const { payout, isLoading, isError, error } = usePayout(id!);

  if (isLoading || !payout) {
    return <SingleColumnPageSkeleton sections={1} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage showMetadata>
      <PayoutGeneralSection payout={payout} />
    </SingleColumnPage>
  );
};
