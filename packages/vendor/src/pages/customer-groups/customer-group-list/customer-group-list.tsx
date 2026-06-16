import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

import {
  CustomerGroupListActions,
  CustomerGroupListCreateButton,
  CustomerGroupListDataTable,
  CustomerGroupListHeader,
  CustomerGroupListTable,
  CustomerGroupListTitle,
} from "./components/customer-group-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <CustomerGroupListTable />}
    </SingleColumnPage>
  );
};

export const CustomerGroupListPage = Object.assign(Root, {
  Table: CustomerGroupListTable,
  Header: CustomerGroupListHeader,
  HeaderTitle: CustomerGroupListTitle,
  HeaderActions: CustomerGroupListActions,
  HeaderCreateButton: CustomerGroupListCreateButton,
  DataTable: CustomerGroupListDataTable,
});
