import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link"
import { Thumbnail } from "@components/common/thumbnail"

type InventoryItemOffer = {
  id: string
  sku: string
  variant?: { title?: string | null } | null
  product?: { title?: string | null; thumbnail?: string | null } | null
}

type AssociatedOffersSectionProps = {
  offers?: InventoryItemOffer[] | null
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
        const label = offer.variant?.title || offer.sku
        const description = [offer.variant?.title, offer.product?.title]
          .filter(Boolean)
          .join(" · ")

        return (
          <SidebarLink
            key={offer.id}
            to={`/offers/${offer.id}`}
            labelKey={label}
            descriptionKey={description}
            icon={<Thumbnail src={offer.product?.thumbnail ?? null} />}
            dataTestid={`inventory-associated-offer-${offer.id}`}
          />
        )
      })}
    </Container>
  )
}
