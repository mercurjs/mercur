// Route: /customers
import { SingleColumnPage } from "@components/layout/pages";
import { CustomerListTable } from "./_components/customer-list-table";

export const Component = () => {
  return (
    <SingleColumnPage>
      <CustomerListTable />
    </SingleColumnPage>
  );
};
