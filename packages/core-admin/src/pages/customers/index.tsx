// Route: /customers
// Customers list page

import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { CustomerListTable } from "./_components/customer-list-table"

export const nav = {
  id: "customers",
  labelKey: "navigation.items.customers",
  iconKey: "users",
  section: "customers",
  order: 40,
}

// Re-export for user overrides
export { CustomerListTable }

export const Component = () => {
  const { getWidgets } = useExtension()

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
