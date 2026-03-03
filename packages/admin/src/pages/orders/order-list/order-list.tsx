import { ReactNode } from "react";

import { SingleColumnPage } from "../../../components/layout/pages";
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition";

import {
  OrderListTable,
  OrderListDataTable,
  OrderListHeader,
  OrderListActions,
  OrderListTitle,
} from "./components/order-list-table";

const ALLOWED_TYPES = [OrderListTable] as const;

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet={false} data-testid="orders-list-page">
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <OrderListTable />}
    </SingleColumnPage>
  );
};

export const OrderList = Root;

export const OrderListPage = Object.assign(Root, {
  Table: OrderListTable,
  Header: OrderListHeader,
  HeaderTitle: OrderListTitle,
  HeaderActions: OrderListActions,
  DataTable: OrderListDataTable,
});
