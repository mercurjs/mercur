import { Tag } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link"

type InventoryItemOffer = { id: string; sku: string }

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
      {offers.map((offer) => (
        <SidebarLink
          key={offer.id}
          to={`/offers/${offer.id}`}
          labelKey={offer.sku}
          descriptionKey=""
          icon={<Tag />}
          dataTestid={`inventory-associated-offer-${offer.id}`}
        />
      ))}
    </Container>
  )
}
