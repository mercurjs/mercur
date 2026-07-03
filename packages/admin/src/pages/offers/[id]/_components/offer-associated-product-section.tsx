import { TriangleRightMini } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Thumbnail } from "../../../../components/common/thumbnail"

/**
 * Sidebar "Associated product" card (SPEC-010). Links to the full admin
 * product page; the offer detail is an offer-scoped view of the same
 * product.
 */
export const OfferAssociatedProductSection = ({
  product,
}: {
  product: Pick<HttpTypes.AdminProduct, "id" | "title" | "handle" | "thumbnail">
}) => {
  const { t } = useTranslation()

  return (
    <Container className="p-0" data-testid="offer-associated-product-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.associatedProduct")}</Heading>
      </div>
      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        <Link
          to={`/products/${product.id}`}
          className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
          data-testid="offer-associated-product-link"
        >
          <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
            <div className="flex items-center gap-3">
              <div className="shadow-elevation-card-rest rounded-md">
                <Thumbnail src={product.thumbnail ?? null} />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="text-ui-fg-base truncate font-medium">
                  {product.title}
                </span>
                {product.handle && (
                  <span className="text-ui-fg-subtle truncate">
                    /{product.handle}
                  </span>
                )}
              </div>
              <div className="size-7 flex items-center justify-center">
                <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </Container>
  )
}
