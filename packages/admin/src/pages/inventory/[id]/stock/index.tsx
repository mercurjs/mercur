// Route: /inventory/:id/stock
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { RouteFocusModal } from "@components/modals";
import { useInventoryItems, useStockLocations } from "@hooks/api";
import { InventoryStockForm } from "./inventory-stock-form";

const INVENTORY_ITEM_IDS_KEY = "inventory_item_ids";

export const Component = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inventoryItemIds =
    searchParams.get(INVENTORY_ITEM_IDS_KEY)?.split(",") || undefined;

  const { inventory_items, isPending, isError, error } = useInventoryItems({
    fields: "id,sku,title,*stock_locations,*location_levels",
    id: inventoryItemIds!,
  });

  const {
    stock_locations,
    isPending: isPendingStockLocations,
    isError: isErrorStockLocations,
    error: errorStockLocations,
  } = useStockLocations({ limit: 9999, fields: "id,name" });

  const ready =
    !isPending &&
    !!inventory_items &&
    !isPendingStockLocations &&
    !!stock_locations;

  if (isError) throw error;
  if (isErrorStockLocations) throw errorStockLocations;

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("inventory.stock.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("inventory.stock.description")}</span>
      </RouteFocusModal.Description>
      {ready && (
        <InventoryStockForm
          items={inventory_items}
          locations={stock_locations}
        />
      )}
    </RouteFocusModal>
  );
};
