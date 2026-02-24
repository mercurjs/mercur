import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { ShippingProfileListHeader } from "./shipping-profile-list-header";
import { ShippingProfileListDataTable } from "./shipping-profile-list-data-table";

export const ShippingProfileListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ShippingProfileListHeader />
          <ShippingProfileListDataTable />
        </>
      )}
    </Container>
  );
};
