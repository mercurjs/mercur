import { SingleColumnPage } from "../../../components/layout/pages"
import { ProductListTable } from "./components/product-list-table"

export const ProductList = () => {
  return (
    <div data-testid="products-page">
      <SingleColumnPage>
        <ProductListTable />
      </SingleColumnPage>
    </div>
  )
}
