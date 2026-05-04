import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  OrderChangeStatus,
} from "@medusajs/framework/utils"

/**
 * Mercur transfer-request invariants. Two rejection branches, both
 * landing as HTTP 400 with a deterministic error code so the admin UI
 * can map each case to its own copy:
 *
 *   - `ORDER_CANCELED_NO_TRANSFER` — order is canceled. Medusa baseline
 *     rejects via `throwIfOrderIsCancelled` but emits no error code.
 *   - `ORDER_TRANSFER_REQUEST_ALREADY_ACTIVE` — another transfer is
 *     already in flight (status requested/pending). Medusa baseline
 *     rejects via its generic order-change guard, also without a code.
 *
 * Active transfer = order_change with `change_type === "transfer"` and
 * `status` in [requested, pending]. Confirmed/declined/canceled are
 * inert and do not block a fresh request.
 *
 * Matcher: /admin/orders/:id/transfer  (:id is the ORDER id.)
 *
 * Method dispatch is internal: filters to POST so non-mutating
 * requests are not disturbed.
 */
export const requireNoActiveTransfer = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    if (req.method !== "POST") {
      return next()
    }

    const params = req.params as { id?: unknown }
    const orderId = params.id
    if (typeof orderId !== "string" || orderId.length === 0) {
      return next()
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Cancel-state branch first — short-circuits before the change query.
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status"],
      filters: { id: orderId },
    })
    const order = orders?.[0] as { status?: string } | undefined
    if (order?.status === "canceled") {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Canceled orders cannot be transferred.",
          "ORDER_CANCELED_NO_TRANSFER"
        )
      )
    }

    const { data: changes } = await query.graph({
      entity: "order_change",
      fields: ["id", "change_type", "status"],
      filters: {
        order_id: orderId,
        change_type: "transfer",
        status: [OrderChangeStatus.REQUESTED, OrderChangeStatus.PENDING],
      },
    })

    if (changes.length > 0) {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Order can not be transferred because there is an active transfer request.",
          "ORDER_TRANSFER_REQUEST_ALREADY_ACTIVE"
        )
      )
    }

    return next()
  } catch (e) {
    return next(e as Error)
  }
}
