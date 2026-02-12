// Route: /inventory
import { SingleColumnPage } from "@components/layout/pages";
import { InventoryListTable } from "./_components/inventory-list-table";

export const Component = () => {
  return (
    <SingleColumnPage>
      <InventoryListTable />
    </SingleColumnPage>
  );
};
