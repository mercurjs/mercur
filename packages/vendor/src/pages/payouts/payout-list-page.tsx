import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  PayoutListTable,
  PayoutListDataTable,
  PayoutListHeader,
  PayoutListActions,
  PayoutListTitle,
} from "./_components/payout-list-table";
import { PayoutAccountSection } from "./_components/payout-account-section";
import { ActivePayoutOnboardingSection } from "./_components/active-payout-onboarding-section";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="payouts.list">
        {Children.count(children) > 0 ? (
          children
        ) : (
          <>
            <ActivePayoutOnboardingSection />
            <PayoutAccountSection />
            <PayoutListTable />
          </>
        )}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const PayoutListPage = Object.assign(Root, {
  OnboardingSection: ActivePayoutOnboardingSection,
  AccountSection: PayoutAccountSection,
  Table: PayoutListTable,
  Header: PayoutListHeader,
  HeaderTitle: PayoutListTitle,
  HeaderActions: PayoutListActions,
  DataTable: PayoutListDataTable,
});
