import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { CustomerGroupListTable } from "./components/customer-group-list-table"

export const CustomerGroupsList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("customer_group.list.after"),
        before: getWidgets("customer_group.list.before"),
      }}
    >
      <CustomerGroupListTable />
    </SingleColumnPage>
  )
}
