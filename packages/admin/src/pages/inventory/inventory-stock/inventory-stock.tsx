import { HttpTypes } from "@medusajs/types"
import { SectionNoAccess, isForbidden, useCan } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { useInventoryItems, useStockLocations } from "../../../hooks/api"
import { INVENTORY_ITEM_IDS_KEY } from "../common/constants"
import { InventoryStockForm } from "./components/inventory-stock-form"

export const InventoryStock = () => {
  const { t } = useTranslation()
  const canViewLocations = useCan("stock_locations")
  const [searchParams] = useSearchParams()
  const inventoryItemIds =
    searchParams.get(INVENTORY_ITEM_IDS_KEY)?.split(",") || undefined

  const { inventory_items, isPending, isError, error } = useInventoryItems({
    id: inventoryItemIds,
    fields: "id,sku,title,*location_levels,offers.seller_id",
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

  // Scope the location columns to the warehouses owned by the sellers behind
  // the selected items' offers — a store can only stock at its own locations.
  const sellerIds = new Set(
    ((inventory_items ?? []) as Array<{ offers?: { seller_id: string }[] }>)
      .flatMap((item) => item.offers ?? [])
      .map((offer) => offer.seller_id)
  )
  const scopedLocations = (
    (stock_locations ?? []) as Array<
      HttpTypes.AdminStockLocation & { seller?: { id: string } }
    >
  ).filter((loc) => !!loc.seller?.id && sellerIds.has(loc.seller.id))

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
        <InventoryStockForm items={inventory_items} locations={scopedLocations} />
      )}
    </RouteFocusModal>
  )
}
