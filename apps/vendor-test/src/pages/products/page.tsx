import { ProductListPage } from "@mercurjs/vendor/pages";
import { Button } from "@medusajs/ui";

const ProductsOverride = () => {
  return (
    <ProductListPage>
      <ProductListPage.Table>
        <ProductListPage.Header>
          <ProductListPage.HeaderTitle />
          <ProductListPage.HeaderActions>
            <Button size="small" variant="secondary">
              Export
            </Button>
            <ProductListPage.HeaderCreateButton />
          </ProductListPage.HeaderActions>
        </ProductListPage.Header>
        <ProductListPage.DataTable />
      </ProductListPage.Table>
    </ProductListPage>
  );
};

export default ProductsOverride;
