import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { PriceListListHeader } from "./price-list-list-header";
import { PriceListListDataTable } from "./price-list-list-data-table";

export const PriceListListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PriceListListHeader />
          <PriceListListDataTable />
        </>
      )}
    </Container>
  );
};
