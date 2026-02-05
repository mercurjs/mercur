import { SingleColumnPage } from "../../../components/layout/pages"
import { CategoryListTable } from "./components/category-list-table"

export const CategoryList = () => {
  return (
    <SingleColumnPage
      hasOutlet
    >
      <CategoryListTable />
    </SingleColumnPage>
  )
}
