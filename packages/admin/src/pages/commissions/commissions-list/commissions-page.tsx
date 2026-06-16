import { Children, ReactNode } from "react";

import { SingleColumnPage } from "../../../components/layout/pages";
import { GlobalCommissionSection } from "./components/global-commission-section/global-commission-section";
import { CommissionRulesTable } from "./components/commission-rules-table/commission-rules-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet data-testid="commissions-page">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <GlobalCommissionSection />
          <CommissionRulesTable />
        </>
      )}
    </SingleColumnPage>
  );
};

export const CommissionsPage = Object.assign(Root, {
  GlobalCommission: GlobalCommissionSection,
  RulesTable: CommissionRulesTable,
});
