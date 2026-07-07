import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

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
      <WidgetZone id="customers.list">
        {Children.count(children) > 0 ? children : <CustomerListTable />}
      </WidgetZone>
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
