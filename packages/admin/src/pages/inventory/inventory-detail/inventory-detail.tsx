import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { useLinkQuery, WidgetZone } from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useInventoryItem } from "@hooks/api"

import { InventoryItemAttributeSection } from "./components/inventory-item-attributes/attributes-section"
import { InventoryItemGeneralSection } from "./components/inventory-item-general-section"
import { InventoryItemLocationLevelsSection } from "./components/inventory-item-location-levels"
import { InventoryItemReservationsSection } from "./components/inventory-item-reservations"
import { AssociatedOffersSection } from "./components/inventory-item-offers/associated-offers-section"
import { INVENTORY_DETAIL_FIELDS } from "./constants"

import type { inventoryItemLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
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

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={inventory_item} showJSON showMetadata data-testid="inventory-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={inventory_item} showJSON showMetadata data-testid="inventory-detail-page">
      <TwoColumnPage.Main data-testid="inventory-detail-main">
        <WidgetZone id="inventory.detail.main" data={inventory_item}>
          <InventoryItemGeneralSection inventoryItem={inventory_item} />
          <InventoryItemLocationLevelsSection
            inventoryItem={inventory_item}
          />
          <InventoryItemReservationsSection inventoryItem={inventory_item} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar data-testid="inventory-detail-sidebar">
        <WidgetZone id="inventory.detail.side" data={inventory_item}>
          <AssociatedOffersSection offers={inventory_item.offers} />
          <InventoryItemAttributeSection inventoryItem={inventory_item} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const InventoryDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: InventoryItemGeneralSection,
  MainLocationLevelsSection: InventoryItemLocationLevelsSection,
  MainReservationsSection: InventoryItemReservationsSection,
  SidebarOffersSection: AssociatedOffersSection,
  SidebarAttributeSection: InventoryItemAttributeSection,
})
