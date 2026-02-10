import { AdminReservationResponse, HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"

import { ActionMenu } from "@components/common/action-menu"
import { PencilSquare } from "@medusajs/icons"
import { SectionRow } from "@components/common/section"
import { useInventoryItem } from "@hooks/api/inventory"
import { useStockLocation } from "@hooks/api/stock-locations"
import { useTranslation } from "react-i18next"

type ReservationGeneralSectionProps = {
  reservation: AdminReservationResponse["reservation"]
}

export const ReservationGeneralSection = ({
  reservation,
}: ReservationGeneralSectionProps) => {
  const { t } = useTranslation()

  const { inventory_item: inventoryItem } = useInventoryItem(
    reservation.inventory_item_id,
    {
      fields: "*location_levels",
    }
  )

  const { stock_location: location } = useStockLocation(reservation.location_id)

  const locationLevel = inventoryItem?.location_levels?.find(
    (l: HttpTypes.AdminInventoryLevel) =>
      l.location_id === reservation.location_id
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>
          {t("inventory.reservation.header", {
            itemName: inventoryItem?.title ?? inventoryItem?.sku,
          })}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: `edit`,
                },
              ],
            },
          ]}
        />
      </div>
      <SectionRow
        title={t("inventory.reservation.lineItemId")}
        value={reservation.line_item_id} // TODO fetch order instead + add link
      />
      <SectionRow
        title={t("inventory.reservation.description")}
        value={reservation.description}
      />
      <SectionRow
        title={t("inventory.reservation.location")}
        value={location?.name}
      />
      <SectionRow
        title={t("inventory.reservation.inStockAtLocation")}
        value={locationLevel?.stocked_quantity}
      />
      <SectionRow
        title={t("inventory.reservation.availableAtLocation")}
        value={locationLevel?.available_quantity}
      />
      <SectionRow
        title={t("inventory.reservation.reservedAtLocation")}
        value={locationLevel?.reserved_quantity}
      />
    </Container>
  )
}
