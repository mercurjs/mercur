import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"

type ProductTagGeneralSectionProps = {
  productTag: HttpTypes.AdminProductTag
}

export const ProductTagGeneralSection = ({
  productTag,
}: ProductTagGeneralSectionProps) => {
  return (
    <Container className="flex items-center justify-between" data-testid="product-tag-general-section-container">
      <div className="flex items-center gap-x-1.5" data-testid="product-tag-general-section-heading-container">
        <span className="text-ui-fg-muted h1-core">#</span>
        <Heading data-testid="product-tag-general-section-heading">{productTag.value}</Heading>
      </div>
    </Container>
  )
}
