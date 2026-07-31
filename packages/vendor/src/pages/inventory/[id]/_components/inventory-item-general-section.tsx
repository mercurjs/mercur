import { Container, Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"

import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "@components/common/action-menu"
import { SectionRow } from "@components/common/section"

const GENERAL_FIELD_IDS = ["title", "sku", "in_stock", "reserved", "available"]

type InventoryItemGeneralSectionProps = {
  inventoryItem: HttpTypes.AdminInventoryItemResponse["inventory_item"]
}
export const InventoryItemGeneralSection = ({
  inventoryItem,
}: InventoryItemGeneralSectionProps) => {
  const { t } = useTranslation()

  const stockedQuantity =
    inventoryItem.location_levels?.reduce(
      (acc, level) => acc + level.stocked_quantity,
      0
    ) || 0
  const reservedQuantity =
    inventoryItem.location_levels?.reduce(
      (acc, level) => acc + level.reserved_quantity,
      0
    ) || 0
  const availableQuantity = stockedQuantity - reservedQuantity

  const getQuantityFormat = (quantity: number) => {
    if (quantity !== undefined && !isNaN(quantity)) {
      return t("inventory.quantityAcrossLocations", {
        quantity,
        locations: inventoryItem.location_levels?.length ?? "-",
      })
    }

    return "-"
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="inventory-item-general-section"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="inventory-item-general-header"
      >
        <DisplayField
          model="inventory_item"
          zone="general"
          id="title"
          data={inventoryItem}
        >
          <Heading data-testid="inventory-item-general-title">
            {inventoryItem.title ?? inventoryItem.sku}
          </Heading>
        </DisplayField>
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
      <DisplayField
        model="inventory_item"
        zone="general"
        id="sku"
        data={inventoryItem}
      >
        <SectionRow title={t("fields.sku")} value={inventoryItem.sku ?? "-"} />
      </DisplayField>
      <DisplayField
        model="inventory_item"
        zone="general"
        id="in_stock"
        data={inventoryItem}
      >
        <SectionRow
          title={t("fields.inStock")}
          value={getQuantityFormat(stockedQuantity)}
        />
      </DisplayField>
      <DisplayField
        model="inventory_item"
        zone="general"
        id="reserved"
        data={inventoryItem}
      >
        <SectionRow
          title={t("inventory.reserved")}
          value={getQuantityFormat(reservedQuantity)}
        />
      </DisplayField>
      <DisplayField
        model="inventory_item"
        zone="general"
        id="available"
        data={inventoryItem}
      >
        <SectionRow
          title={t("inventory.available")}
          value={getQuantityFormat(availableQuantity)}
        />
      </DisplayField>
      <DisplayExtensionZone
        model="inventory_item"
        zone="general"
        data={inventoryItem}
        builtInFieldIds={GENERAL_FIELD_IDS}
      />
    </Container>
  )
}
