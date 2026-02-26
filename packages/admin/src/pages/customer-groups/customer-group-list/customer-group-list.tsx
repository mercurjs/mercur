import { SingleColumnPage } from "../../../components/layout/pages";
import { CustomerGroupListTable } from "./components/customer-group-list-table";

export const CustomerGroupsList = () => {
  return (
    <SingleColumnPage>
      <CustomerGroupListTable />
    </SingleColumnPage>
  );
};
