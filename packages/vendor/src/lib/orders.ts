import { AdminOrder, AdminOrderLineItem, HttpTypes } from "@medusajs/types"

export const getPaymentsFromOrder = (order: HttpTypes.AdminOrder) => {
  return order.payment_collections
    .map((collection: HttpTypes.AdminPaymentCollection) => collection.payments)
    .flat(1)
    .filter(Boolean) as HttpTypes.AdminPayment[]
}

/**
 * Returns a limit for number of reservations that order can have.
 *
 * Mercur offers link inventory items to the offer (not the product variant),
 * so `variant.inventory_items` is empty for offer-based orders. Count the
 * offer's `inventory_item_link` rows first — a kit offer reserves one
 * inventory item per link — and only fall back to the variant inventory
 * count (or 1) when there is no offer link. Undercounting here truncates the
 * reservations query and leaves freshly-allocated items showing as "Not
 * allocated" (MER-187).
 */
export function getReservationsLimitCount(order: AdminOrder) {
  if (!order?.items?.length) {
    return 0
  }

  return order.items.reduce((acc: number, item: AdminOrderLineItem) => {
    const offerLinkCount = (
      item as unknown as {
        offer?: { inventory_item_link?: unknown[] | null }
      }
    ).offer?.inventory_item_link?.length
    const variantInventoryCount = item.variant?.inventory_items?.length

    return acc + (offerLinkCount || variantInventoryCount || 1)
  }, 0)
}
