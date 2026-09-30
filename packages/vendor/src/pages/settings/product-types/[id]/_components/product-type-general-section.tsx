import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"

type ProductTypeGeneralSectionProps = {
  productType: HttpTypes.AdminProductType
}

export const ProductTypeGeneralSection = ({
  productType,
}: ProductTypeGeneralSectionProps) => {
  return (
    <Container className="flex items-center justify-between">
      <Heading>{productType.value}</Heading>
    </Container>
  )
}
