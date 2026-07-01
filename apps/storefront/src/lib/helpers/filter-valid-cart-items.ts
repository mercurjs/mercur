import { HttpTypes } from "@medusajs/types"

/**
 * Filters out cart items with invalid data (missing subtotal or variant)
 * This prevents UI crashes when items don't have proper price data
 * @param items - Array of cart line items
 * @returns Array of valid cart items that can be safely rendered
 */
export function filterValidCartItems(
  items: HttpTypes.StoreCartLineItem[] | undefined | null
): HttpTypes.StoreCartLineItem[] {
  if (!items) {
    return []
  }

  return items.filter((item) => {
    return (
      item.subtotal !== null &&
      item.subtotal !== undefined &&
      item.variant !== null
    )
  })
}

