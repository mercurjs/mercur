import { ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition";
import { OrderListHeader } from "./order-list-header";
import { OrderListDataTable } from "./order-list-data-table";

const TABLE_ALLOWED_TYPES = [OrderListHeader, OrderListDataTable] as const;

export const OrderListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0" data-testid="orders-container">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
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
