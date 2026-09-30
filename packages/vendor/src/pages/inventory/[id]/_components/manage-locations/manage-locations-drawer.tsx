import { Heading } from "@medusajs/ui";
import { SectionNoAccess, useCan } from "@mercurjs/dashboard-shared";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router-dom";
import { RouteDrawer } from "@components/modals";
import { useInventoryItem } from "@hooks/api/inventory";
import { useStockLocations } from "@hooks/api/stock-locations";
import { ManageLocationsForm } from "./components/manage-locations-form";
import { INVENTORY_DETAIL_FIELDS } from "../../constants";

export const ManageLocationsDrawer = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const {
    inventory_item: inventoryItem,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItem(id!, {
    fields: INVENTORY_DETAIL_FIELDS,
  });

  const canViewLocations = useCan("stock_locations");

  const { stock_locations, isLoading: loadingLocations } = useStockLocations(
    undefined,
    { enabled: canViewLocations },
  );

  const ready =
    !isLoading && !loadingLocations && inventoryItem && stock_locations;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("inventory.manageLocations")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!canViewLocations ? (
        <RouteDrawer.Body>
          <SectionNoAccess className="p-0" />
        </RouteDrawer.Body>
      ) : (
        ready && (
          <ManageLocationsForm
            item={inventoryItem}
            locations={stock_locations}
          />
        )
      )}
    </RouteDrawer>
  );
};
