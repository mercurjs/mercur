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
 * Rejects admin write requests whose body.items[] references a
 * variant_id whose product is owned by a different seller than the
 * order's. Applies to:
 *   - POST /admin/order-edits/:id/items
 *   - POST /admin/claims/:id/outbound/items
 *   - POST /admin/exchanges/:id/outbound/items
 *
 * Each matcher supplies its own `resolveOrderId` because the way to
 * walk from the URL parameter to an order id differs per entity.
 *
 * Scoped to the same-seller check in this middleware. Price and
 * inventory eligibility are surfaced to the admin UI through the
 * /admin/orders/:id/addable-variants resolver; if a stricter backend
 * guard is needed later it can be layered on top of this one.
 */
export const requireSellerValidAddItem = (
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
      const body = (req.body ?? {}) as {
        items?: Array<{ variant_id?: string }>
      }
      const variantIds = (body.items ?? [])
        .map((i) => i?.variant_id)
        .filter((id): id is string => typeof id === "string")
      if (variantIds.length === 0) {
        return next()
      }

      const orderId = await resolveOrderId(req)
      if (!orderId) {
        return next()
      }

      const { seller_id } = await resolveOrderSeller(req.scope, orderId)

      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: links } = await query.graph({
        entity: "product_variant",
        fields: ["id", "product.seller.id"],
        filters: { id: variantIds },
      })

      const rows = links as Array<{
        id: string
        product?: { seller?: { id?: string } }
      }>
      const valid = new Set(
        rows
          .filter((v) => v.product?.seller?.id === seller_id)
          .map((v) => v.id)
      )

      const mismatched = variantIds.find((id) => !valid.has(id))
      if (mismatched) {
        return next(
          new MedusaError(
            MedusaError.Types.FORBIDDEN,
            "Variant is not valid for the order's seller.",
            "VARIANT_NOT_SELLER_VALID"
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
 * Medusa's POST /admin/order-edits/:id/items handler reads `:id`
 * directly as `order_id` — not as an order_edit primary key — so no
 * extra query is needed. Returning `req.params.id` matches that shape.
 */
export const orderIdFromOrderEditParam: OrderIdResolver = (req) =>
  (req.params as { id?: string })?.id ?? null
