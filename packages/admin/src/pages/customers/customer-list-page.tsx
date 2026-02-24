import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

import {
  CustomerListTable,
  CustomerListDataTable,
  CustomerListHeader,
  CustomerListActions,
  CustomerListTitle,
} from "./_components/customer-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <CustomerListTable />}
    </SingleColumnPage>
  );
};

export const CustomerListPage = Object.assign(Root, {
  Table: CustomerListTable,
  Header: CustomerListHeader,
  HeaderTitle: CustomerListTitle,
  HeaderActions: CustomerListActions,
  DataTable: CustomerListDataTable,
});
