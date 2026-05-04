import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { getOrderItemMutationLimits } from "../helpers/can-mutate-order-item"

/**
 * Rejects admin order-edit item mutations that would corrupt the order
 * ledger: a POST with quantity below fulfilled + returned.
 *
 * Mirrors the UI gating in `order-edit-item.tsx` so the UI and the
 * server agree on the same invariant. The UI may short-circuit the
 * round-trip, but the backend is the source of truth.
 *
 * Matcher: /admin/order-edits/:id/items/item/:item_id
 *   :id is the ORDER id (Medusa's naming — not the order_change id).
 *   :item_id is the order line-item id, queried directly here.
 *
 * Removal note: Medusa 2.x exposes no DELETE handler on this path —
 * a "remove" from an order edit is expressed as POST quantity=0, which
 * this middleware blocks via the same `requested < minQty` rule. The
 * separate REMOVE error code from the spec is therefore unreachable
 * on this matcher and is not emitted.
 */
export const requireEditableOrderItem = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    if (req.method !== "POST") {
      return next()
    }

    const params = req.params as { id?: unknown; item_id?: unknown }
    const orderId = params.id
    const itemId = params.item_id
    if (
      typeof orderId !== "string" ||
      orderId.length === 0 ||
      typeof itemId !== "string" ||
      itemId.length === 0
    ) {
      return next()
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "items.id",
        "items.quantity",
        "items.detail.fulfilled_quantity",
        "items.detail.returned_quantity",
      ],
      filters: { id: orderId },
    })
    type ItemRow = {
      id: string
      quantity: number
      detail?: {
        fulfilled_quantity?: number
        returned_quantity?: number
      }
    }
    const order = data?.[0] as { items?: ItemRow[] } | undefined
    const item = order?.items?.find((i) => i.id === itemId)

    // Item missing → let the downstream route surface its own 404.
    if (!item) {
      return next()
    }

    const limits = getOrderItemMutationLimits(item)

    const body = (req.body ?? {}) as { quantity?: unknown }
    const requested =
      typeof body.quantity === "number" ? body.quantity : undefined
    if (
      requested !== undefined &&
      limits.canRemove === false &&
      requested < limits.minQty
    ) {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Cannot reduce quantity below fulfilled + returned (${limits.minQty})`,
          "ITEM_CANNOT_REDUCE_BELOW_FULFILLED_RETURNED"
        )
      )
    }

    return next()
  } catch (e) {
    return next(e as Error)
  }
}
