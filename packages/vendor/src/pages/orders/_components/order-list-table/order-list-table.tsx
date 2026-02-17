import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { OrderListHeader } from "./order-list-header";
import { OrderListDataTable } from "./order-list-data-table";

export const OrderListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <OrderListHeader />
          <OrderListDataTable />
        </>
      )}
    </Container>
  );
};
