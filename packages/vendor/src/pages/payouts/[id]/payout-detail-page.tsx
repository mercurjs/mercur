import { Children, ReactNode } from "react";
import { useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";
import { usePayout } from "@hooks/api/payouts";

import { PayoutGeneralSection } from "./_components/payout-general-section";
import { PayoutReferencesSection } from "./_components/payout-references-section";
import { PayoutReversalsSection } from "./_components/payout-reversals-section";
import { PayoutStatusAlert } from "./_components/payout-status-alert";

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();

  const { payout, isLoading, isError, error } = usePayout(id!);

  if (isLoading || !payout) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />;
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={payout} showJSON showMetadata>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={payout} showJSON showMetadata>
      <TwoColumnPage.Main>
        <WidgetZone id="payouts.detail.main" data={payout}>
          <PayoutStatusAlert payout={payout} />
          <PayoutGeneralSection payout={payout} />
          <PayoutReversalsSection payout={payout} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="payouts.detail.side" data={payout}>
          <PayoutReferencesSection payout={payout} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const PayoutDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainStatusAlert: PayoutStatusAlert,
  MainGeneralSection: PayoutGeneralSection,
  MainReversalsSection: PayoutReversalsSection,
  SidebarReferencesSection: PayoutReferencesSection,
});
