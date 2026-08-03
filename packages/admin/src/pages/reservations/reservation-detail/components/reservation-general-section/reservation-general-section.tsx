import { AdminReservationResponse } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { PencilSquare } from "@medusajs/icons"
import { SectionRow } from "../../../../../components/common/section"
import { useInventoryItem } from "../../../../../hooks/api/inventory"
import { useStockLocation } from "../../../../../hooks/api/stock-locations"
import { useTranslation } from "react-i18next"

type ReservationGeneralSectionProps = {
  reservation: AdminReservationResponse["reservation"]
}

export const ReservationGeneralSection = ({
  reservation,
}: ReservationGeneralSectionProps) => {
  const { t } = useTranslation()

  const { inventory_item: inventoryItem, isPending: isLoadingInventoryItem } =
    useInventoryItem(reservation.inventory_item_id)

  const { stock_location: location, isPending: isLoadingLocation } =
    useStockLocation(reservation.location_id)

  if (
    isLoadingInventoryItem ||
    !inventoryItem ||
    isLoadingLocation ||
    !location
  ) {
    return <div>Loading...</div>
  }

  const locationLevel = inventoryItem.location_levels!.find(
    (level) =>
      level.location_id === reservation.location_id
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <DisplayField
          model="reservation"
          zone="general"
          id="header"
          data={reservation}
        >
          <Heading>
            {t("inventory.reservation.header", {
              itemName: inventoryItem.title ?? inventoryItem.sku,
            })}
          </Heading>
        </DisplayField>
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
      <DisplayField
        model="reservation"
        zone="general"
        id="item_id"
        data={reservation}
      >
        <SectionRow
          title={t("inventory.reservation.itemId")}
          value={inventoryItem.sku ?? inventoryItem.id}
        />
      </DisplayField>
      <DisplayField
        model="reservation"
        zone="general"
        id="description"
        data={reservation}
      >
        <SectionRow
          title={t("inventory.reservation.description")}
          value={reservation.description}
        />
      </DisplayField>
      <DisplayField
        model="reservation"
        zone="general"
        id="location"
        data={reservation}
      >
        <SectionRow
          title={t("inventory.reservation.location")}
          value={location?.name}
        />
      </DisplayField>
      <DisplayField
        model="reservation"
        zone="general"
        id="stocked_quantity"
        data={reservation}
      >
        <SectionRow
          title={t("inventory.reservation.inStockAtLocation")}
          value={
            <Text size="small" leading="compact">
              {locationLevel?.stocked_quantity ?? "-"}
            </Text>
          }
        />
      </DisplayField>
      <DisplayField
        model="reservation"
        zone="general"
        id="available_quantity"
        data={reservation}
      >
        <SectionRow
          title={t("inventory.reservation.availableAtLocation")}
          value={
            <Text size="small" leading="compact">
              {locationLevel?.available_quantity ?? "-"}
            </Text>
          }
        />
      </DisplayField>
      <DisplayField
        model="reservation"
        zone="general"
        id="reserved_quantity"
        data={reservation}
      >
        <SectionRow
          title={t("inventory.reservation.reservedAtLocation")}
          value={
            <Text size="small" leading="compact">
              {locationLevel?.reserved_quantity ?? "-"}
            </Text>
          }
        />
      </DisplayField>
      <DisplayExtensionZone
        model="reservation"
        zone="general"
        data={reservation}
        builtInFieldIds={[
          "header",
          "item_id",
          "description",
          "location",
          "stocked_quantity",
          "available_quantity",
          "reserved_quantity",
        ]}
      />
    </Container>
  )
}
