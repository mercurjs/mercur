import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

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
      <WidgetZone id="customer-groups.list">
        {Children.count(children) > 0 ? children : <CustomerGroupListTable />}
      </WidgetZone>
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
