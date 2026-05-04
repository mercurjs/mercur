import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { isWithinExchangeWindow } from "../helpers/exchange-window"

/**
 * Mercur exchange-window invariant. Reject `POST /admin/exchanges`
 * when the target order is older than the configured window
 * (currently 30 days, per designer Note K — see
 * `helpers/exchange-window.ts`).
 *
 * Medusa baseline accepts exchange creation regardless of order age
 * because the policy is project-specific. This middleware enforces
 * the Mercur rule with HTTP 400 + `EXCHANGE_WINDOW_EXPIRED` so the
 * admin UI can map the rejection to dedicated copy.
 *
 * Method dispatch is internal: only POST is gated; GETs bypass.
 *
 * The order id arrives in the request body (`order_id`) per the
 * Medusa create-exchange contract.
 */
export const requireExchangeWindowOpen = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    if (req.method !== "POST") {
      return next()
    }

    const body = (req.body ?? {}) as { order_id?: unknown }
    const orderId = body.order_id
    if (typeof orderId !== "string" || orderId.length === 0) {
      return next()
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "created_at"],
      filters: { id: orderId },
    })
    type OrderRow = { id: string; created_at: string | Date }
    const order = orders?.[0] as OrderRow | undefined

    // Order missing → let the downstream handler 404.
    if (!order) {
      return next()
    }

    if (!isWithinExchangeWindow(order.created_at)) {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "The exchange window for this order has expired.",
          "EXCHANGE_WINDOW_EXPIRED"
        )
      )
    }

    return next()
  } catch (e) {
    return next(e as Error)
  }
}
