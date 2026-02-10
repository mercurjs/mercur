// Route: /customers
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { CustomerListTable } from "./_components/customer-list-table"

export const Component = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("customer.list.after"),
        before: getWidgets("customer.list.before"),
      }}
    >
      <CustomerListTable />
    </SingleColumnPage>
  )
}
