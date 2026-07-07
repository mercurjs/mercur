import "@mercurjs/vendor/extension-targets"
import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import { Container, Text } from "@medusajs/ui"

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

const ProductListBanner = () => {
  return (
    <Container className="mb-2">
      <Text size="small" className="text-ui-fg-subtle">
        Tip: bulk-import products from the Products menu.
      </Text>
    </Container>
  )
}

export default ProductListBanner
