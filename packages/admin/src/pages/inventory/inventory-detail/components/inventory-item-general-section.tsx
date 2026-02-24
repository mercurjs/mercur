import { Container, Heading } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "@components/common/action-menu"
import { SectionRow } from "@components/common/section"
import type { ExtendedAdminInventoryItem } from "@custom-types/inventory"

type InventoryItemGeneralSectionProps = {
  inventoryItem: ExtendedAdminInventoryItem
}

export const InventoryItemGeneralSection = ({
  inventoryItem,
}: InventoryItemGeneralSectionProps) => {
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
    <Container className="divide-y p-0" data-testid="inventory-item-general-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="inventory-item-general-header">
        <Heading data-testid="inventory-item-general-title">
          {inventoryItem.title ?? inventoryItem.sku} {t("fields.details")}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "edit",
                },
              ],
            },
          ]}
          data-testid="inventory-item-general-action-menu"
        />
      </div>
      <SectionRow title={t("fields.sku")} value={inventoryItem.sku ?? "-"} data-testid="inventory-item-sku-row" />
      <SectionRow
        title={t("fields.inStock")}
        value={getQuantityFormat(inventoryItem.stocked_quantity)}
        data-testid="inventory-item-in-stock-row"
      />

      <SectionRow
        title={t("inventory.reserved")}
        value={getQuantityFormat(inventoryItem.reserved_quantity)}
        data-testid="inventory-item-reserved-row"
      />
      <SectionRow
        title={t("inventory.available")}
        value={getQuantityFormat(
          inventoryItem.stocked_quantity - inventoryItem.reserved_quantity
        )}
        data-testid="inventory-item-available-row"
      />
    </Container>
  )
}
