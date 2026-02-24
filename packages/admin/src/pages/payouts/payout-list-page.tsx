import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

import {
  PayoutListTable,
  PayoutListDataTable,
  PayoutListHeader,
  PayoutListActions,
  PayoutListTitle,
} from "./_components/payout-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <PayoutListTable />}
    </SingleColumnPage>
  );
};

export const PayoutListPage = Object.assign(Root, {
  Table: PayoutListTable,
  Header: PayoutListHeader,
  HeaderTitle: PayoutListTitle,
  HeaderActions: PayoutListActions,
  DataTable: PayoutListDataTable,
});
