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
 * Rejects admin transfer requests when an active transfer already
 * exists for the order. Medusa baseline 400s on this case via its
 * generic order-change guard but emits no specific error code, so the
 * UI cannot map the rejection to dedicated copy. This middleware
 * short-circuits with `ORDER_TRANSFER_REQUEST_ALREADY_ACTIVE` before
 * the workflow runs, giving the UI a deterministic code to translate.
 *
 * Matcher: /admin/orders/:id/transfer
 *   :id is the ORDER id.
 *
 * Method dispatch is internal: the transfer endpoint is POST-only on
 * this matcher. GETs (if any) bypass to avoid disturbing read paths.
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
