import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { ProductTagListTable } from "./_components/product-tag-list-table"

export const Component = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      showMetadata={false}
      showJSON={false}
      hasOutlet
      widgets={{
        after: getWidgets("product_tag.list.after"),
        before: getWidgets("product_tag.list.before"),
      }}
    >
      <ProductTagListTable />
    </SingleColumnPage>
  )
}

export { productTagListLoader as loader } from "./loader"
