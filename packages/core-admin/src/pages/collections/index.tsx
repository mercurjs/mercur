import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { CollectionListTable } from "./_components/collection-list-table"

export const nav = {
  id: "collections",
  labelKey: "navigation.items.collections",
  parent: "products",
  order: 10,
}

export const Component = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("product_collection.list.after"),
        before: getWidgets("product_collection.list.before"),
      }}
    >
      <CollectionListTable />
    </SingleColumnPage>
  )
}
