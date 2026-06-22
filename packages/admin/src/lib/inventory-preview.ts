/**
 * Echoes the offer-aware inventory math to the operator before they confirm
 * a return / exchange / claim. The backend
 * (`mercur-confirm-return-receive`, `mercur-confirm-exchange-request`,
 * `mercur-confirm-claim-request`) already runs the same math when the
 * action is confirmed; this preview just makes it visible at the point
 * of decision so the operator knows exactly how stock will move.
 *
 * Per offer, every `inventory_item_link` row contributes
 * `quantity × required_quantity` units to the linked inventory item.
 * Bundles surface as multiple lines, one per linked inventory item.
 */

export type OfferInventoryLinkRow = {
  required_quantity?: number | null
  inventory_item_id?: string | null
  inventory_item?: {
    id?: string | null
    title?: string | null
    sku?: string | null
  } | null
}

export type OfferShape = {
  sku?: string | null
  inventory_item_link?: OfferInventoryLinkRow[] | null
}

export type LineItemShape = {
  id: string
  title?: string | null
  variant_title?: string | null
  variant_sku?: string | null
  offer?: OfferShape | null
}

export type RestockPreviewRow = {
  inventoryItemId: string
  inventoryItemLabel: string
  delta: number
}

/**
 * Returns the inventory movement that will happen when `quantity` units of
 * the offer behind this line item are received. Returns `[]` when the
 * item carries no offer link (legacy orders) or when quantity is non-positive.
 */
export const getOfferRestockPreview = (
  item: LineItemShape | null | undefined,
  quantity: number
): RestockPreviewRow[] => {
  if (!item || quantity <= 0) {
    return []
  }
  const links = item.offer?.inventory_item_link ?? []
  if (!links.length) {
    return []
  }

  return links
    .map<RestockPreviewRow | null>((link) => {
      const inventoryItemId =
        link.inventory_item?.id ?? link.inventory_item_id ?? null
      if (!inventoryItemId) {
        return null
      }
      const required = link.required_quantity ?? 1
      if (required <= 0) {
        return null
      }
      const label =
        link.inventory_item?.title ||
        link.inventory_item?.sku ||
        inventoryItemId
      return {
        inventoryItemId,
        inventoryItemLabel: label,
        delta: quantity * required,
      }
    })
    .filter((row): row is RestockPreviewRow => row !== null)
}
