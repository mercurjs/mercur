import { SingleColumnPage } from "../../../components/layout/pages"
import { CustomerListTable } from "./components/customer-list-table"

export const CustomersList = () => {
  return (
    <SingleColumnPage>
      <CustomerListTable />
    </SingleColumnPage>
  )
}
