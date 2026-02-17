import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { PayoutListHeader } from "./payout-list-header";
import { PayoutListDataTable } from "./payout-list-data-table";

export const PayoutListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PayoutListHeader />
          <PayoutListDataTable />
        </>
      )}
    </Container>
  );
};
