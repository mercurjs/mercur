// Route: /price-lists
import { SingleColumnPage } from "@components/layout/pages";
import { PriceListListTable } from "./_components/price-list-list-table";

export const Component = () => {
  return (
    <SingleColumnPage>
      <PriceListListTable />
    </SingleColumnPage>
  );
};
