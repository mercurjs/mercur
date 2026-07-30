import { Container, Heading } from "@medusajs/ui"
import { BuildingStorefront } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import type { ExtendedAdminInventoryItem } from "@custom-types/inventory"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"

type ReservationInventorySectionProps = {
  inventoryItem: ExtendedAdminInventoryItem
}

export const ReservationInventorySection = ({
  inventoryItem,
}: ReservationInventorySectionProps) => {
  const { t } = useTranslation()

  const getQuantityFormat = (quantity: number) => {
    if (quantity !== undefined && !isNaN(quantity)) {
      return t("inventory.quantityAcrossLocations", {
        quantity,
        locations: inventoryItem.location_levels?.length,
      })
    }

    return "-"
  }

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
        value={getQuantityFormat(inventoryItem.stocked_quantity)}
        data-testid="reservation-inventory-in-stock-row"
      />
      <SectionRow
        title={t("inventory.reserved")}
        value={getQuantityFormat(inventoryItem.reserved_quantity)}
        data-testid="reservation-inventory-reserved-row"
      />
      <SectionRow
        title={t("inventory.available")}
        value={getQuantityFormat(
          inventoryItem.stocked_quantity - inventoryItem.reserved_quantity
        )}
        data-testid="reservation-inventory-available-row"
      />
    </Container>
  )
}
