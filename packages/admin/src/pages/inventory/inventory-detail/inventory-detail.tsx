import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useInventoryItem } from "@hooks/api"

import { InventoryItemAttributeSection } from "./components/inventory-item-attributes/attributes-section"
import { InventoryItemGeneralSection } from "./components/inventory-item-general-section"
import { InventoryItemLocationLevelsSection } from "./components/inventory-item-location-levels"
import { InventoryItemReservationsSection } from "./components/inventory-item-reservations"
import { InventoryItemVariantsSection } from "./components/inventory-item-variants/variants-section"
import { INVENTORY_DETAIL_FIELDS } from "./constants"

import type { inventoryItemLoader } from "./loader"

const ALLOWED_TYPES = [TwoColumnPage.Main, TwoColumnPage.Sidebar, InventoryItemGeneralSection, InventoryItemLocationLevelsSection, InventoryItemReservationsSection, InventoryItemVariantsSection, InventoryItemAttributeSection] as const

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
    {
      fields: INVENTORY_DETAIL_FIELDS,
    },
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

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <TwoColumnPage data={inventory_item} showJSON showMetadata data-testid="inventory-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={inventory_item} showJSON showMetadata data-testid="inventory-detail-page">
      <TwoColumnPage.Main data-testid="inventory-detail-main">
        <InventoryItemGeneralSection inventoryItem={inventory_item} />
        <InventoryItemLocationLevelsSection
          inventoryItem={inventory_item}
        />
        <InventoryItemReservationsSection inventoryItem={inventory_item} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar data-testid="inventory-detail-sidebar">
        {inventory_item.variants &&
          inventory_item.variants?.length > 0 && (
            <InventoryItemVariantsSection
              variants={inventory_item.variants}
            />
          )}
        <InventoryItemAttributeSection inventoryItem={inventory_item} />
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
  SidebarVariantsSection: InventoryItemVariantsSection,
  SidebarAttributeSection: InventoryItemAttributeSection,
})
