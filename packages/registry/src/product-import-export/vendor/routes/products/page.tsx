import { Link } from "react-router-dom"
import { Button } from "@medusajs/ui"
import { ArrowDownTray, ArrowUpTray } from "@medusajs/icons"
import { ProductListPage } from "@mercurjs/vendor/pages"

export default function ProductsWithImportExport() {
  return (
    <ProductListPage>
      <ProductListPage.Table>
        <ProductListPage.Header>
          <ProductListPage.HeaderTitle />
          <ProductListPage.HeaderActions>
            <Button size="small" variant="secondary" asChild>
              <Link to="import">
                <ArrowUpTray />
                Import
              </Link>
            </Button>
            <Button size="small" variant="secondary" asChild>
              <Link to="export">
                <ArrowDownTray />
                Export
              </Link>
            </Button>
            <ProductListPage.HeaderCreateButton />
          </ProductListPage.HeaderActions>
        </ProductListPage.Header>
        <ProductListPage.DataTable />
      </ProductListPage.Table>
    </ProductListPage>
  )
}
