import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  OrderListTable,
  OrderListDataTable,
  OrderListHeader,
  OrderListActions,
  OrderListTitle,
} from "./_components/order-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="orders.list">
        {Children.count(children) > 0 ? children : <OrderListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const OrderListPage = Object.assign(Root, {
  Table: OrderListTable,
  Header: OrderListHeader,
  HeaderTitle: OrderListTitle,
  HeaderActions: OrderListActions,
  DataTable: OrderListDataTable,
});
