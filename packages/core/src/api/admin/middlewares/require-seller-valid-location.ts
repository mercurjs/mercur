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
 * Rejects admin write requests whose body carries a `location_id` for a
 * stock location that is not linked to the order's seller. Opt-in per
 * matcher because the source of the order id varies by endpoint:
 *   - POST /admin/returns → body.order_id
 *   - POST /admin/returns/:id → lookup via return.order_id
 *   - POST /admin/claims/:id/inbound/items → lookup via claim.order_id
 *   - POST /admin/exchanges/:id/inbound/items → lookup via exchange.order_id
 *
 * If the request does not include `location_id`, the middleware is a
 * no-op — location is optional in all covered Medusa schemas.
 */
export const requireSellerValidLocation = (
  resolveOrderId: OrderIdResolver
) => {
  return async (
    req: AuthenticatedMedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    try {
      if (req.method !== "POST") {
        return next()
      }
      const body = (req.body ?? {}) as { location_id?: string }
      const locationId = body.location_id
      if (!locationId) {
        return next()
      }

      const orderId = await resolveOrderId(req)
      if (!orderId) {
        return next()
      }

      const { seller_id } = await resolveOrderSeller(req.scope, orderId)

      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: links } = await query.graph({
        entity: "stock_location_seller",
        fields: ["stock_location_id"],
        filters: { seller_id, stock_location_id: locationId },
      })

      if (links.length === 0) {
        // FORBIDDEN → HTTP 403 (Medusa's error-handler maps NOT_ALLOWED
        // to 400, FORBIDDEN to 403). Seller-scope violation is an
        // authz failure, not a business-rule violation, so 403 is the
        // right status semantically.
        return next(
          new MedusaError(
            MedusaError.Types.FORBIDDEN,
            "Stock location is not valid for the order's seller.",
            "LOCATION_NOT_SELLER_VALID"
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
 * Extract the order id from the request for matchers that own it in the
 * request body (e.g. POST /admin/returns). Other matchers compose their
 * own resolver that walks the containing entity (return / claim / exchange)
 * to the order_id.
 */
export const orderIdFromBody: OrderIdResolver = (req) => {
  const body = (req.body ?? {}) as { order_id?: string }
  return body.order_id ?? null
}
