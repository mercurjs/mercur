import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { ProductTypeListTable } from "./_components/product-type-list-table"

export const Component = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("product_type.list.after"),
        before: getWidgets("product_type.list.before"),
      }}
    >
      <ProductTypeListTable />
    </SingleColumnPage>
  )
}
