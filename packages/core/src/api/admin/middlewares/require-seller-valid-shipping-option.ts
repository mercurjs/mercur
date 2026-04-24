import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { resolveOrderSeller } from "../helpers/resolve-order-seller"

type OrderIdResolver = (
  req: AuthenticatedMedusaRequest
) => Promise<string | null | undefined> | string | null | undefined

/**
 * Rejects admin write requests whose body carries a `shipping_option_id`
 * that is not linked to the order's seller. Covers return, claim, and
 * exchange /shipping-method endpoints (both inbound and outbound for
 * claims and exchanges). Each matcher provides its own `resolveOrderId`
 * because the way to reach the order id differs:
 *   - return shipping-method: return_id (params.id) → order_id
 *   - claim/exchange shipping-method: claim_id / exchange_id → order_id
 */
export const requireSellerValidShippingOption = (
  resolveOrderId: OrderIdResolver
) => {
  return async (
    req: AuthenticatedMedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    try {
      // Medusa registers methods-tagged middlewares as route handlers
      // (app.post) which run after the core handler responds. This
      // middleware is wired without `method` in the matchers list so
      // it runs via app.use before any routes — we filter by method
      // manually.
      if (req.method !== "POST") {
        return next()
      }
      const body = (req.body ?? {}) as { shipping_option_id?: string }
      const shippingOptionId = body.shipping_option_id
      if (!shippingOptionId) {
        return next()
      }

      const orderId = await resolveOrderId(req)
      if (!orderId) {
        return next()
      }

      const { seller_id } = await resolveOrderSeller(req.scope, orderId)

      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: links } = await query.graph({
        entity: "shipping_option_seller",
        fields: ["shipping_option_id"],
        filters: {
          seller_id,
          shipping_option_id: shippingOptionId,
        },
      })

      if (links.length === 0) {
        return next(
          new MedusaError(
            MedusaError.Types.FORBIDDEN,
            "Shipping option is not valid for the order's seller.",
            "SHIPPING_OPTION_NOT_SELLER_VALID"
          )
        )
      }

      return next()
    } catch (err) {
      return next(err as Error)
    }
  }
}

/**
 * Resolve the order id for a `/admin/returns/:id/shipping-method`
 * request by looking up the return's `order_id`.
 */
export const orderIdFromReturnParam: OrderIdResolver = async (req) => {
  const returnId = (req.params as { id?: string })?.id
  if (!returnId) return null
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "return",
    fields: ["id", "order_id"],
    filters: { id: returnId },
  })
  return (data[0] as { order_id?: string } | undefined)?.order_id ?? null
}
