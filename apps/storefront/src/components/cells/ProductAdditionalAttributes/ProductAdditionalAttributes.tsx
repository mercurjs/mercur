import { ProductPageAccordion } from '@/components/molecules/ProductPageAccordion/ProductPageAccordion';
import type { WrappedProductAttributeDTO } from "@mercurjs/types"

export const ProductAdditionalAttributes = ({
  attributes,
}: {
  attributes: WrappedProductAttributeDTO[]
}) => {
  const rows = attributes.filter((attribute) => attribute.values?.length)

  if (!rows.length) return null

  return (
    <ProductPageAccordion heading="Additional attributes" defaultOpen={false} data-testid="product-additional-attributes-section">
      {rows.map((attribute) => (
        <div
          key={attribute.id}
          className="border rounded-sm grid grid-cols-2 text-center label-md"
          data-testid={`product-attribute-${(attribute.handle ?? attribute.name ?? attribute.id).toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="border-r py-3">{attribute.name}</div>
          <div className="py-3">
            {attribute.values.map((value) => value.name).join(", ")}
          </div>
        </div>
      ))}
    </ProductPageAccordion>
  )
}
