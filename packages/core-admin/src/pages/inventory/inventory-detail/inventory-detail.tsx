import { useLoaderData, useParams } from "react-router-dom"
import { INVENTORY_DETAIL_FIELDS } from "./constants"
import type { inventoryItemLoader } from "./loader"
import { useInventoryItem } from "@hooks/api"
import { useExtension } from "@providers/extension-provider"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { InventoryItemGeneralSection } from "./components/inventory-item-general-section"
import { InventoryItemLocationLevelsSection } from "./components/inventory-item-location-levels"
import { InventoryItemReservationsSection } from "./components/inventory-item-reservations"
import { InventoryItemVariantsSection } from "./components/inventory-item-variants/variants-section"
import { InventoryItemAttributeSection } from "./components/inventory-item-attributes/attributes-section"

export const InventoryDetail = () => {
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

  const { getWidgets } = useExtension()

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
    <div data-testid="inventory-detail-page">
      <TwoColumnPage
        widgets={{
          after: getWidgets("inventory_item.details.after"),
          before: getWidgets("inventory_item.details.before"),
          sideAfter: getWidgets("inventory_item.details.side.after"),
          sideBefore: getWidgets("inventory_item.details.side.before"),
        }}
        data={inventory_item}
        showJSON
        showMetadata
      >
        <TwoColumnPage.Main data-testid="inventory-detail-main">
          <InventoryItemGeneralSection inventoryItem={inventory_item} />
          <InventoryItemLocationLevelsSection inventoryItem={inventory_item} />
          <InventoryItemReservationsSection inventoryItem={inventory_item} />
        </TwoColumnPage.Main>
        <TwoColumnPage.Sidebar data-testid="inventory-detail-sidebar">
          {inventory_item.variants && inventory_item.variants?.length > 0 && (
            <InventoryItemVariantsSection
              variants={inventory_item.variants}
            />
          )}
          <InventoryItemAttributeSection inventoryItem={inventory_item} />
        </TwoColumnPage.Sidebar>
      </TwoColumnPage>
    </div>
  )
}
