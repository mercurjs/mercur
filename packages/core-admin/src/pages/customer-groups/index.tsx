import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { CustomerGroupListTable } from "./_components/customer-group-list-table"

export const nav = {
  id: "customer-groups",
  labelKey: "navigation.items.customerGroups",
  parent: "customers",
  order: 20,
}

export const Component = () => {
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
