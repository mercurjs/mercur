import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { ProductListTable } from "./components/product-list-table"

export const ProductList = () => {
  const { getWidgets } = useExtension()

  return (
    <div data-testid="products-page">
      <SingleColumnPage
        widgets={{
          after: getWidgets("product.list.after"),
          before: getWidgets("product.list.before"),
        }}
      >
        <ProductListTable />
      </SingleColumnPage>
    </div>
  )
}
