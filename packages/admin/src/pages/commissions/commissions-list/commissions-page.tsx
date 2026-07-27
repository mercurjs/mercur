import { Children, ReactNode } from "react";

import { WidgetZone } from "@mercurjs/dashboard-shared";

import { SingleColumnPage } from "../../../components/layout/pages";
import { GlobalCommissionSection } from "./components/global-commission-section/global-commission-section";
import { CommissionRulesTable } from "./components/commission-rules-table/commission-rules-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet data-testid="commissions-page">
      <WidgetZone id="commissions.list">
        {Children.count(children) > 0 ? (
          children
        ) : (
          <>
            <GlobalCommissionSection />
            <CommissionRulesTable />
          </>
        )}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const CommissionsPage = Object.assign(Root, {
  GlobalCommission: GlobalCommissionSection,
  RulesTable: CommissionRulesTable,
});
