import { ProductPageAccordion } from "@/components/molecules"
import { AdditionalAttributeProps } from "@/types/product"

export const ProductAdditionalAttributes = ({
  attributes,
}: {
  attributes: AdditionalAttributeProps[]
}) => {

  if (!attributes?.length) return null

  const nonEmptyAttributes = attributes.filter((attribute) => !!attribute && attribute.id)

  return (
    <ProductPageAccordion heading="Additional attributes" defaultOpen={false} data-testid="product-additional-attributes-section">
      {nonEmptyAttributes.map((attribute) => (
        <div
          key={attribute.id}
          className="border rounded-sm grid grid-cols-2 text-center label-md"
          data-testid={`product-attribute-${attribute.attribute?.name?.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="border-r py-3">{attribute.attribute?.name}</div>
          <div className="py-3">{attribute.value}</div>
        </div>
      ))}
    </ProductPageAccordion>
  )
}
