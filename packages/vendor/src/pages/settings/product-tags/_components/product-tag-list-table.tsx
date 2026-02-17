import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { ProductTagListHeader } from "./product-tag-list-header";
import { ProductTagListDataTable } from "./product-tag-list-data-table";

export const ProductTagListTable = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <Container className="divide-y px-0 py-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductTagListHeader />
          <ProductTagListDataTable />
        </>
      )}
    </Container>
  );
};
