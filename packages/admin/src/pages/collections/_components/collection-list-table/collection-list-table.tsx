import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";
import { Outlet } from "react-router-dom";

import { CollectionListHeader } from "./collection-list-header";
import { CollectionListDataTable } from "./collection-list-data-table";

export const CollectionListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CollectionListHeader />
          <CollectionListDataTable />
        </>
      )}
      <Outlet />
    </Container>
  );
};
