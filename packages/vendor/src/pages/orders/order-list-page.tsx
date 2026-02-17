import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

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
