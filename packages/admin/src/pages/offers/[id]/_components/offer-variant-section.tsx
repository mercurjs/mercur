import { TriangleRightMini } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Thumbnail } from "../../../../components/common/thumbnail"
import { OfferDetail } from "../../common/types"

type Props = { offer: OfferDetail }

export const OfferVariantSection = ({ offer }: Props) => {
  const { t } = useTranslation()
  const variant = offer.product_variant

  if (!variant?.id) {
    return null
  }

  const productId = variant.product_id ?? variant.product?.id
  const link = productId
    ? `/products/${productId}/variants/${variant.id}`
    : null

  const title = variant.product?.title ?? variant.title ?? variant.id
  const subtitle = variant.title ?? ""

  const Inner = (
    <div
      className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors"
      data-testid="offer-detail-master-variant"
    >
      <div className="flex items-center gap-3">
        <div
          className="shadow-elevation-card-rest rounded-md"
          data-testid="offer-detail-master-variant-thumbnail"
        >
          <Thumbnail src={variant.product?.thumbnail ?? null} />
        </div>
        <div className="flex flex-1 flex-col">
          <span
            className="text-ui-fg-base font-medium"
            data-testid="offer-detail-master-variant-title"
          >
            {title}
          </span>
          <span
            className="text-ui-fg-subtle"
            data-testid="offer-detail-master-variant-options"
          >
            {subtitle}
          </span>
        </div>
        <div className="size-7 flex items-center justify-center">
          <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
        </div>
      </div>
    </div>
  )

  return (
    <Container
      className="p-0"
      data-testid="offer-detail-master-variant-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.productVariant")}</Heading>
      </div>
      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        {link ? (
          <Link
            to={link}
            className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
            data-testid="offer-detail-master-variant-link"
          >
            {Inner}
          </Link>
        ) : (
          <div>{Inner}</div>
        )}
      </div>
    </Container>
  )
}
