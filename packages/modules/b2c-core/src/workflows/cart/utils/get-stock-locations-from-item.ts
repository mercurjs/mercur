interface StockLocation {
  id: string
  fulfillment_sets?: {
    service_zones?: {
      shipping_options?: { id: string }[]
    }[]
  }[]
}

interface CartItemWithInventory {
  variant?: {
    inventory_items?: {
      inventory?: {
        location_levels?: {
          stock_locations?: StockLocation[]
        }[]
      }
    }[]
  }
}

export const getStockLocationsFromItem = (
  item: CartItemWithInventory
): StockLocation[] => {
  return (item.variant?.inventory_items ?? [])
    .flatMap((inv) => inv.inventory?.location_levels ?? [])
    .flatMap((level) => level.stock_locations ?? [])
}

