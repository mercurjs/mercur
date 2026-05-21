type LocationLevel = {
  stocked_quantity?: number | null
  reserved_quantity?: number | null
}

type InventoryItemNode = {
  location_levels?: LocationLevel[] | null
}

type InventoryItemLink = {
  required_quantity?: number | null
  inventory_item?: InventoryItemNode | null
}

export type OfferStockShape = {
  inventory_item_link?: InventoryItemLink[] | null
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

const LOW_STOCK_THRESHOLD = 5

export const computeEffectiveStock = (offer: OfferStockShape): number => {
  const links = offer.inventory_item_link ?? []

  if (links.length === 0) {
    return 0
  }

  const perItemAvailable = links.map((link) => {
    const required = Math.max(1, link.required_quantity ?? 1)
    const levels = link.inventory_item?.location_levels ?? []
    const totalAvailable = levels.reduce((sum, level) => {
      const stocked = level.stocked_quantity ?? 0
      const reserved = level.reserved_quantity ?? 0
      return sum + Math.max(0, stocked - reserved)
    }, 0)
    return Math.floor(totalAvailable / required)
  })

  if (perItemAvailable.length === 0) {
    return 0
  }

  return Math.min(...perItemAvailable)
}

export const getStockStatus = (offer: OfferStockShape): StockStatus => {
  const effective = computeEffectiveStock(offer)
  if (effective <= 0) return "out_of_stock"
  if (effective <= LOW_STOCK_THRESHOLD) return "low_stock"
  return "in_stock"
}

export const getStockStatusColor = (
  status: StockStatus,
): "green" | "orange" | "red" => {
  switch (status) {
    case "in_stock":
      return "green"
    case "low_stock":
      return "orange"
    case "out_of_stock":
      return "red"
  }
}
