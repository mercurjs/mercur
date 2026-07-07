import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

export const config = defineWidgetConfig({
  zone: "product.detail.side.before",
})

const ProductDetailInfo = ({ data }: { data?: { title?: string; id?: string } }) => {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Extension</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Widget for {data?.title ?? "this product"} ({data?.id}).
        </Text>
      </div>
    </Container>
  )
}

export default ProductDetailInfo
