import { ProductPageAccordion } from "@/components/molecules"
import { isRichText, sanitizeRichText } from "@/lib/helpers/sanitize-rich-text"

export const ProductPageDetails = ({ details }: { details: string }) => {
  if (!details) return null

  return (
    <ProductPageAccordion heading="Product details" defaultOpen={false} data-testid="product-details-section">
      {isRichText(details) ? (
        <div
          className="product-details"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(details),
          }}
          data-testid="product-details-content"
        />
      ) : (
        <div
          className="product-details whitespace-pre-line"
          data-testid="product-details-content"
        >
          {details}
        </div>
      )}
    </ProductPageAccordion>
  )
}
