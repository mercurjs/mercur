import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { CollectionListTable } from "./components/collection-list-table"

export const CollectionList = () => {
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
