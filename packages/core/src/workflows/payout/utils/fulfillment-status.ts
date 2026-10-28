import { BigNumberInput, FulfillmentStatus } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"

export type FulfillmentRow = {
  canceled_at?: Date | string | null
  shipped_at?: Date | string | null
  delivered_at?: Date | string | null
  items?: { line_item_id?: string | null; quantity: BigNumberInput }[] | null
}

export type FulfillableOrder = {
  items?: { id: string; quantity: BigNumberInput }[] | null
  fulfillments?: FulfillmentRow[] | null
}

export const ORDER_FULFILLMENT_FIELDS = [
  "items.id",
  "items.quantity",
  "fulfillments.canceled_at",
  "fulfillments.shipped_at",
  "fulfillments.delivered_at",
  "fulfillments.items.line_item_id",
  "fulfillments.items.quantity",
]

const FULFILLMENT_SCALE: FulfillmentStatus[] = [
  "not_fulfilled",
  "partially_fulfilled",
  "fulfilled",
  "partially_shipped",
  "shipped",
  "partially_delivered",
  "delivered",
]

export function fulfillmentReached(status: string | null | undefined, required: FulfillmentStatus): boolean {
  if (status === "canceled") {
    return false
  }
  return FULFILLMENT_SCALE.indexOf((status ?? "not_fulfilled") as FulfillmentStatus) >= FULFILLMENT_SCALE.indexOf(required)
}

/**
 * The order module derives `fulfillment_status` only on its own read path,
 * not through query.graph, so the pipeline rebuilds it from the fulfillments
 * the same way: a status is reached when every ordered unit is in a
 * fulfillment that reached it, partial when some are.
 */
export function deriveFulfillmentStatus(order: FulfillableOrder): FulfillmentStatus {
  const ordered = (order.items ?? []).reduce<BigNumberInput>((acc, item) => MathBN.add(acc, item.quantity), 0)
  if (MathBN.lte(ordered, 0)) {
    return "not_fulfilled"
  }

  const active = (order.fulfillments ?? []).filter((f) => !f.canceled_at)
  const count = (predicate: (f: FulfillmentRow) => boolean) =>
    active
      .filter(predicate)
      .flatMap((f) => f.items ?? [])
      .reduce<BigNumberInput>((acc, item) => MathBN.add(acc, item.quantity), 0)

  const fulfilled = count(() => true)
  const shipped = count((f) => !!f.shipped_at)
  const delivered = count((f) => !!f.delivered_at)

  if (MathBN.gte(delivered, ordered)) return "delivered"
  if (MathBN.gt(delivered, 0)) return "partially_delivered"
  if (MathBN.gte(shipped, ordered)) return "shipped"
  if (MathBN.gt(shipped, 0)) return "partially_shipped"
  if (MathBN.gte(fulfilled, ordered)) return "fulfilled"
  if (MathBN.gt(fulfilled, 0)) return "partially_fulfilled"
  return "not_fulfilled"
}
