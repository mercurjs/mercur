import { ReactNode, Children } from "react";

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
      {Children.count(children) > 0 ? children : <OrderListTable />}
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
