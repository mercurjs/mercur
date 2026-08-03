import { Container } from "@medusajs/ui";

import { ReviewListHeader } from "./review-list-header";
import { ReviewListDataTable } from "./review-list-data-table";

export const ReviewListTable = () => {
  return (
    <Container className="divide-y p-0">
      <ReviewListHeader />
      <ReviewListDataTable />
    </Container>
  );
};
