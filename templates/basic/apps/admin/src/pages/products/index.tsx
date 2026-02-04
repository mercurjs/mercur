import { Badge, Button } from "@medusajs/ui"
import { ProductsPage } from "@mercurjs/core-admin/pages/products"

  const VendorBadge = () => (
    <Badge color="purple">Mercur Marketplace</Badge>
  )

  export const Component = () => {
    const { goToCreate, labels } = ProductsPage.useActions();

    return (
      <ProductsPage>
        <ProductsPage.Header title="🛍️ Products">
          <ProductsPage.Actions hideCreate />

          <Button size="small" onClick={goToCreate}>
            🆕 {labels.create} Vendor Product
          </Button>

          <VendorBadge />
        </ProductsPage.Header>

        <ProductsPage.Table />
      </ProductsPage>
    )
  }