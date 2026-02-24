import { Container, Heading } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import type { ExtendedAdminInventoryItem } from "@custom-types/inventory"
import { ActionMenu } from "@components/common/action-menu"
import { SectionRow } from "@components/common/section"
import { getFormattedCountry } from "@lib/addresses"

type InventoryItemAttributeSectionProps = {
  inventoryItem: ExtendedAdminInventoryItem
}

export const InventoryItemAttributeSection = ({
  inventoryItem,
}: InventoryItemAttributeSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0" data-testid="inventory-item-attribute-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="inventory-item-attribute-header">
        <Heading level="h2" data-testid="inventory-item-attribute-title">{t("products.attributes")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "attributes",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
          data-testid="inventory-item-attribute-action-menu"
        />
      </div>
      <SectionRow title={t("fields.height")} value={inventoryItem.height} data-testid="inventory-item-height-row" />
      <SectionRow title={t("fields.width")} value={inventoryItem.width} data-testid="inventory-item-width-row" />
      <SectionRow title={t("fields.length")} value={inventoryItem.length} data-testid="inventory-item-length-row" />
      <SectionRow title={t("fields.weight")} value={inventoryItem.weight} data-testid="inventory-item-weight-row" />
      <SectionRow title={t("fields.midCode")} value={inventoryItem.mid_code} data-testid="inventory-item-mid-code-row" />
      <SectionRow title={t("fields.material")} value={inventoryItem.material} data-testid="inventory-item-material-row" />
      <SectionRow title={t("fields.hsCode")} value={inventoryItem.hs_code} data-testid="inventory-item-hs-code-row" />
      <SectionRow
        title={t("fields.countryOfOrigin")}
        value={getFormattedCountry(inventoryItem.origin_country)}
        data-testid="inventory-item-country-of-origin-row"
      />
    </Container>
  )
}
