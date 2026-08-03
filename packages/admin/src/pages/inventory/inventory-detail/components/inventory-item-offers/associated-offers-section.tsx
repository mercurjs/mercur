import { Container, Heading } from "@medusajs/ui"
import { OfferDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link"
import { Thumbnail } from "@components/common/thumbnail"

type AssociatedOffersSectionProps = {
  offers?: OfferDTO[] | null
}

export const AssociatedOffersSection = ({
  offers,
}: AssociatedOffersSectionProps) => {
  const { t } = useTranslation()

  if (!offers?.length) {
    return null
  }

  return (
    <Container className="p-0" data-testid="inventory-item-offers-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="inventory-item-offers-title">
          {t("inventory.associatedOffers")}
        </Heading>
      </div>
      {offers.map((offer) => {
        const variantTitle = offer.product_variant?.title
        const productTitle = offer.product_variant?.product?.title
        const label = variantTitle || offer.sku
        const description = [variantTitle, productTitle]
          .filter(Boolean)
          .join(" · ")

        return (
          <SidebarLink
            key={offer.id}
            to={`/offers/${offer.product_id}/variants/${offer.id}`}
            labelKey={label}
            descriptionKey={description}
            icon={
              <Thumbnail
                src={offer.product_variant?.product?.thumbnail ?? null}
              />
            }
            dataTestid={`inventory-associated-offer-${offer.id}`}
          />
        )
      })}
    </Container>
  )
}
