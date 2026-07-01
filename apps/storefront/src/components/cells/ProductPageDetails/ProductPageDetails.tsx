import { ProductPageAccordion } from "@/components/molecules"

export const ProductPageDetails = ({ details }: { details: string }) => {
  if (!details) return null

  return (
    <ProductPageAccordion heading="Product details" defaultOpen={false} data-testid="product-details-section">
      <div
        className="product-details"
        dangerouslySetInnerHTML={{
          __html: details,
        }}
        data-testid="product-details-content"
      />
    </ProductPageAccordion>
  )
}
