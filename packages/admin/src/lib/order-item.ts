import { OrderLineItemDTO } from "@medusajs/types"

export const getFulfillableQuantity = (item: OrderLineItemDTO) => {
  return item.quantity - item.detail.fulfilled_quantity
}

type FulfillmentItemLike = {
  line_item_id: string
  inventory_item_id?: string | null
  quantity: number
  title: string
}

type DisplayFulfillmentItem = {
  line_item_id: string
  quantity: number
  title: string
}

const getRequiredQuantity = (
  lineItem: OrderLineItemDTO | undefined,
  inventoryItemId?: string | null
) => {
  if (!lineItem?.variant?.inventory_items?.length || !inventoryItemId) {
    return 1
  }

  const inventoryItem = lineItem.variant.inventory_items.find((item) => {
    return (
      item.inventory?.id === inventoryItemId ||
      item.inventory_item_id === inventoryItemId
    )
  })

  return inventoryItem?.required_quantity || 1
}

const getNormalizedFulfillmentQuantity = (
  fulfillmentItem: FulfillmentItemLike,
  lineItem: OrderLineItemDTO | undefined
) => {
  const requiredQuantity = getRequiredQuantity(
    lineItem,
    fulfillmentItem.inventory_item_id
  )

  if (!requiredQuantity) {
    return fulfillmentItem.quantity
  }

  const normalizedQuantity = fulfillmentItem.quantity / requiredQuantity

  return Number.isFinite(normalizedQuantity)
    ? normalizedQuantity
    : fulfillmentItem.quantity
}

/**
 * Fulfillment items are stored in inventory units for kits
 * (`required_quantity * line item quantity`), so we normalize them
 * back to line-item units for admin display.
 */
export const getDisplayFulfillmentItems = (
  fulfillmentItems: FulfillmentItemLike[],
  orderItemsMap: Map<string, OrderLineItemDTO>
): DisplayFulfillmentItem[] => {
  const deduped = new Map<string, DisplayFulfillmentItem>()

  for (const fulfillmentItem of fulfillmentItems) {
    const lineItem = orderItemsMap.get(fulfillmentItem.line_item_id)
    const quantity = getNormalizedFulfillmentQuantity(fulfillmentItem, lineItem)
    const title =
      lineItem?.variant_title || lineItem?.title || fulfillmentItem.title

    if (deduped.has(fulfillmentItem.line_item_id)) {
      const current = deduped.get(fulfillmentItem.line_item_id)!
      current.quantity = Math.max(current.quantity, quantity)
      continue
    }

    deduped.set(fulfillmentItem.line_item_id, {
      line_item_id: fulfillmentItem.line_item_id,
      quantity,
      title,
    })
  }

  return Array.from(deduped.values())
}
