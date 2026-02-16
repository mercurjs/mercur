// Route: /promotions
import { SingleColumnPage } from "@components/layout/pages";
import { PromotionListTable } from "./_components/promotion-list-table";

export const Component = () => {
  return (
    <SingleColumnPage>
      <PromotionListTable />
    </SingleColumnPage>
  );
};
