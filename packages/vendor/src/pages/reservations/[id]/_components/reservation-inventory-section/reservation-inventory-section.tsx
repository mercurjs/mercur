import { Container, Heading } from "@medusajs/ui"
import { BuildingStorefront } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "@components/common/action-menu"
import { SectionRow } from "@components/common/section"

type ReservationInventorySectionProps = {
  inventoryItem: HttpTypes.AdminInventoryItemResponse["inventory_item"]
}

export const ReservationInventorySection = ({
  inventoryItem,
}: ReservationInventorySectionProps) => {
  const { t } = useTranslation()

  const stockedQuantity =
    inventoryItem.location_levels?.reduce(
      (acc, level) => acc + level.stocked_quantity,
      0
    ) ?? 0
  const reservedQuantity =
    inventoryItem.location_levels?.reduce(
      (acc, level) => acc + level.reserved_quantity,
      0
    ) ?? 0
  const availableQuantity = stockedQuantity - reservedQuantity

  const getQuantityFormat = (quantity: number) =>
    t("inventory.quantityAcrossLocations", {
      quantity,
      locations: inventoryItem.location_levels?.length ?? 0,
    })

  return (
    <Container
      className="divide-y p-0"
      data-testid="reservation-inventory-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading data-testid="reservation-inventory-title">
          {inventoryItem.title ?? inventoryItem.sku}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <BuildingStorefront />,
                  label: t("inventory.reservation.goToInventoryItem"),
                  to: `/inventory/${inventoryItem.id}`,
                },
              ],
            },
          ]}
          data-testid="reservation-inventory-action-menu"
        />
      </div>
      <SectionRow
        title={t("fields.sku")}
        value={inventoryItem.sku ?? "-"}
        data-testid="reservation-inventory-sku-row"
      />
      <SectionRow
        title={t("fields.inStock")}
        value={getQuantityFormat(stockedQuantity)}
        data-testid="reservation-inventory-in-stock-row"
      />
      <SectionRow
        title={t("inventory.reserved")}
        value={getQuantityFormat(reservedQuantity)}
        data-testid="reservation-inventory-reserved-row"
      />
      <SectionRow
        title={t("inventory.available")}
        value={getQuantityFormat(availableQuantity)}
        data-testid="reservation-inventory-available-row"
      />
    </Container>
  )
}
