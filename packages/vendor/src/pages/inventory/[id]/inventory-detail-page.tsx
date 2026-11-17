import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  detailPageDefaultEntries,
  LayoutComposer,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { useInventoryItem } from "@hooks/api/inventory";

import { InventoryItemAttributeSection } from "./_components/inventory-item-attributes/attributes-section";
import { InventoryItemGeneralSection } from "./_components/inventory-item-general-section";
import { InventoryItemLocationLevelsSection } from "./_components/inventory-item-location-levels";
import { InventoryItemReservationsSection } from "./_components/inventory-item-reservations";
import { AssociatedOffersSection } from "./_components/inventory-item-offers/associated-offers-section";
import { INVENTORY_DETAIL_FIELDS } from "./constants";

import { loader } from "./loader";

export const InventoryDetailPage = () => {
  const { id } = useParams();
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const {
    inventory_item,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItem(
    id!,
    useLinkQuery("inventory_item", INVENTORY_DETAIL_FIELDS),
    { initialData },
  );

  if (isLoading || !inventory_item) {
    return (
      <TwoColumnPageSkeleton
        showJSON
        mainSections={3}
        sidebarSections={2}
        showMetadata
      />
    );
  }

  if (isError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="inventory.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={inventory_item}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="InventoryItemGeneralSection">
              <InventoryItemGeneralSection inventoryItem={inventory_item} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="InventoryItemLocationLevelsSection">
              <InventoryItemLocationLevelsSection
                inventoryItem={inventory_item}
              />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="InventoryItemReservationsSection">
              <InventoryItemReservationsSection
                inventoryItem={inventory_item}
              />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(inventory_item)}
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="AssociatedOffersSection">
              <AssociatedOffersSection
                offers={(inventory_item as any).offers}
              />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="InventoryItemAttributeSection">
              <InventoryItemAttributeSection
                inventoryItem={inventory_item as any}
              />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  );
};
