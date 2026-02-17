import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";
import { Outlet } from "react-router-dom";

import { CustomerListHeader } from "./customer-list-header";
import { CustomerListDataTable } from "./customer-list-data-table";

export const CustomerListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CustomerListHeader />
          <CustomerListDataTable />
        </>
      )}
      <Outlet />
    </Container>
  );
};
