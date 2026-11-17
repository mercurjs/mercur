import { useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  detailPageDefaultEntries,
  LayoutComposer,
} from "@mercurjs/dashboard-shared";
import { usePayout } from "@hooks/api/payouts";

import { PayoutGeneralSection } from "./_components/payout-general-section";
import { PayoutReferencesSection } from "./_components/payout-references-section";
import { PayoutReversalsSection } from "./_components/payout-reversals-section";
import { PayoutStatusAlert } from "./_components/payout-status-alert";

export const PayoutDetailPage = () => {
  const { id } = useParams();

  const { payout, isLoading, isError, error } = usePayout(id!);

  if (isLoading || !payout) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />;
  }

  if (isError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="payouts.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={payout}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="PayoutStatusAlert">
              <PayoutStatusAlert payout={payout} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PayoutGeneralSection">
              <PayoutGeneralSection payout={payout} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PayoutReversalsSection">
              <PayoutReversalsSection payout={payout} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(payout)}
          </>
        ),
        side: (
          <LayoutComposer.Entry id="PayoutReferencesSection">
            <PayoutReferencesSection payout={payout} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
