import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";
import { Outlet } from "react-router-dom";

import { InventoryListHeader } from "./inventory-list-header";
import { InventoryListDataTable } from "./inventory-list-data-table";

export const InventoryListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <InventoryListHeader />
          <InventoryListDataTable />
        </>
      )}
      <Outlet />
    </Container>
  );
};
