import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { PromotionListHeader } from "./promotion-list-header";
import { PromotionListDataTable } from "./promotion-list-data-table";

export const PromotionListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PromotionListHeader />
          <PromotionListDataTable />
        </>
      )}
    </Container>
  );
};
