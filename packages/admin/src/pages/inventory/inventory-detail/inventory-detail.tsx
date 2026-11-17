import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { useInventoryItem } from "@hooks/api"

import { InventoryItemAttributeSection } from "./components/inventory-item-attributes/attributes-section"
import { InventoryItemGeneralSection } from "./components/inventory-item-general-section"
import { InventoryItemLocationLevelsSection } from "./components/inventory-item-location-levels"
import { InventoryItemReservationsSection } from "./components/inventory-item-reservations"
import { AssociatedOffersSection } from "./components/inventory-item-offers/associated-offers-section"
import { INVENTORY_DETAIL_FIELDS } from "./constants"

import type { inventoryItemLoader } from "./loader"

export const InventoryDetailPage = () => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof inventoryItemLoader>
  >

  const {
    inventory_item,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItem(
    id!,
    useLinkQuery("inventory_item", INVENTORY_DETAIL_FIELDS),
    {
      initialData,
    }
  )

  if (isLoading || !inventory_item) {
    return (
      <TwoColumnPageSkeleton
        showJSON
        mainSections={3}
        sidebarSections={2}
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="inventory.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={inventory_item}
      data-testid="inventory-detail-page"
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
              <PermissionGuard permission="reservations:view">
                <InventoryItemReservationsSection
                  inventoryItem={inventory_item}
                />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(inventory_item)}
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="AssociatedOffersSection">
              <AssociatedOffersSection offers={inventory_item.offers} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="InventoryItemAttributeSection">
              <InventoryItemAttributeSection inventoryItem={inventory_item} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}
