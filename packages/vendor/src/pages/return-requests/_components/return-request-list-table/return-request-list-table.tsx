import { Container } from "@medusajs/ui";

import { ReturnRequestListHeader } from "./return-request-list-header";
import { ReturnRequestListDataTable } from "./return-request-list-data-table";

export const ReturnRequestListTable = () => {
  return (
    <Container className="divide-y p-0">
      <ReturnRequestListHeader />
      <ReturnRequestListDataTable />
    </Container>
  );
};
