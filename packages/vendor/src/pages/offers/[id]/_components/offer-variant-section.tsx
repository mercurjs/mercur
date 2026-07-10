import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "../../../../components/common/sidebar-link/sidebar-link"
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
  const link = productId ? `/products/${productId}/variants/${variant.id}` : null

  const title = variant.product?.title ?? variant.title ?? variant.id
  const subtitle = variant.title ?? ""
  const thumbnail = <Thumbnail src={variant.product?.thumbnail ?? null} />

  return (
    <Container className="p-0" data-testid="offer-detail-variant-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.productVariant")}</Heading>
      </div>
      {link ? (
        <SidebarLink
          to={link}
          labelKey={title}
          descriptionKey={subtitle}
          icon={thumbnail}
          dataTestid="offer-detail-variant-link"
        />
      ) : (
        <div className="flex flex-col gap-2 px-2 pb-2">
          <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="shadow-elevation-card-rest rounded-md">
                {thumbnail}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-ui-fg-base font-medium">{title}</span>
                <span className="text-ui-fg-subtle">{subtitle}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
