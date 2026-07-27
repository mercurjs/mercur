import { ReactNode, Children } from "react";

import { WidgetZone } from "@mercurjs/dashboard-shared";
import { SingleColumnPage } from "../../../components/layout/pages";
import {
  OrderListTable,
  OrderListDataTable,
  OrderListHeader,
  OrderListActions,
  OrderListTitle,
} from "./components/order-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet={false} data-testid="orders-list-page">
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
