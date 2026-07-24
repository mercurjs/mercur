import { HttpTypes } from "@medusajs/types"

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

