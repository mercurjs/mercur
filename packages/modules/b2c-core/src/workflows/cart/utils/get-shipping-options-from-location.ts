interface StockLocationWithFulfillment {
  id: string
  fulfillment_sets?: {
    service_zones?: {
      shipping_options?: { id: string }[]
    }[]
  }[]
}

export const getShippingOptionsFromLocation = (
  stockLocation: StockLocationWithFulfillment
): string[] => {
  return (stockLocation.fulfillment_sets ?? [])
    .flatMap((fs) => fs.service_zones ?? [])
    .flatMap((sz) => sz.shipping_options ?? [])
    .map((so) => so.id)
}

