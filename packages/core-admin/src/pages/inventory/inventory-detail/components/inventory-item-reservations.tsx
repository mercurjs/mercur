import type { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { ReservationItemTable } from "./reservations-table/reservation-list-table"

type InventoryItemLocationLevelsSectionProps = {
  inventoryItem: HttpTypes.AdminInventoryItemResponse["inventory_item"]
}
export const InventoryItemReservationsSection = ({
  inventoryItem,
}: InventoryItemLocationLevelsSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0" data-testid="inventory-item-reservations-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="inventory-item-reservations-header">
        <Heading data-testid="inventory-item-reservations-title">{t("reservations.domain")}</Heading>
        <Button size="small" variant="secondary" asChild data-testid="inventory-create-reservation-button">
          <Link to={`/reservations/create?item_id=${inventoryItem.id}`} data-testid="inventory-create-reservation-link">
            {t("actions.create")}
          </Link>
        </Button>
      </div>
      <ReservationItemTable inventoryItem={inventoryItem} />
    </Container>
  )
}
