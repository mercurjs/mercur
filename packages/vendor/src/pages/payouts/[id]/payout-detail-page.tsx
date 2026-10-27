import { Children, ReactNode } from "react";
import { useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";
import { usePayout } from "@hooks/api/payouts";

import { PayoutGeneralSection } from "./_components/payout-general-section";
import { PayoutReversalsSection } from "./_components/payout-reversals-section";

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();

  const { payout, isLoading, isError, error } = usePayout(id!);

  if (isLoading || !payout) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage showMetadata>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <WidgetZone id="payouts.detail.main" data={payout}>
          <PayoutGeneralSection payout={payout} />
          <PayoutReversalsSection payout={payout} />
        </WidgetZone>
      )}
    </SingleColumnPage>
  );
};

export const PayoutDetailPage = Object.assign(Root, {
  GeneralSection: PayoutGeneralSection,
  ReversalsSection: PayoutReversalsSection,
});
