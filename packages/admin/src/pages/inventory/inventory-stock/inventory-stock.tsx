import { SectionNoAccess, isForbidden, useCan } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { useInventoryItems, useStockLocations } from "../../../hooks/api"
import { INVENTORY_ITEM_IDS_KEY } from "../common/constants"
import { InventoryStockForm } from "./components/inventory-stock-form"
import { StockGridItem, StockGridLocation, scopeLocationsToItems } from "./utils"

export const InventoryStock = () => {
  const { t } = useTranslation()
  const canViewLocations = useCan("stock_locations")
  const [searchParams] = useSearchParams()
  const inventoryItemIds =
    searchParams.get(INVENTORY_ITEM_IDS_KEY)?.split(",") || undefined

  const { inventory_items, isPending, isError, error } = useInventoryItems({
    id: inventoryItemIds,
    fields:
      "id,sku,title,*location_levels,seller.id,offers.seller_id,offers.product_variant.product.title",
  })

  const {
    stock_locations,
    isPending: isPendingStockLocations,
    isError: isErrorStockLocations,
    error: errorStockLocations,
  } = useStockLocations(
    {
      limit: 9999,
      fields: "id,name,seller.id",
    },
    { enabled: canViewLocations }
  )

  const ready =
    !isPending &&
    !!inventory_items &&
    !isPendingStockLocations &&
    !!stock_locations

  if (isError) {
    throw error
  }

  const noAccess =
    !canViewLocations ||
    (isErrorStockLocations && isForbidden(errorStockLocations))

  if (isErrorStockLocations && !noAccess) {
    throw errorStockLocations
  }

  const items = (inventory_items ?? []) as StockGridItem[]
  const scopedLocations = scopeLocationsToItems(
    items,
    (stock_locations ?? []) as StockGridLocation[]
  )

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("inventory.stock.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("inventory.stock.description")}</span>
      </RouteFocusModal.Description>
      {noAccess && (
        <>
          <RouteFocusModal.Header />
          <RouteFocusModal.Body>
            <SectionNoAccess />
          </RouteFocusModal.Body>
        </>
      )}
      {ready && (
        <InventoryStockForm items={items} locations={scopedLocations} />
      )}
    </RouteFocusModal>
  )
}
