import { Button, Container, Heading } from "@medusajs/ui";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ItemLocationListTable } from "./location-levels-table/location-list-table";
import type { ExtendedAdminInventoryItem } from "@custom-types/inventory";

type InventoryItemLocationLevelsSectionProps = {
  inventoryItem: ExtendedAdminInventoryItem;
};
export const InventoryItemLocationLevelsSection = ({
  inventoryItem,
}: InventoryItemLocationLevelsSectionProps) => {
  const { t } = useTranslation();

  return (
    <Container
      className="divide-y p-0"
      data-testid="inventory-item-location-levels-section"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="inventory-item-location-levels-header"
      >
        <Heading data-testid="inventory-item-location-levels-title">
          {t("inventory.locationLevels")}
        </Heading>
        <Button
          size="small"
          variant="secondary"
          asChild
          data-testid="inventory-manage-locations-button"
        >
          <Link to="locations" data-testid="inventory-manage-locations-link">
            {t("inventory.manageLocations")}
          </Link>
        </Button>
      </div>
      <ItemLocationListTable inventory_item_id={inventoryItem.id} />
    </Container>
  );
};
