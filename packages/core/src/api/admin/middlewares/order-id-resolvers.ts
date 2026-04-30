import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type OrderIdResolver = (
  req: AuthenticatedMedusaRequest
) => Promise<string | null | undefined> | string | null | undefined

/**
 * Resolve the order id for `/admin/claims/:id/...` requests by looking up
 * the claim's `order_id`. Used by all claim matchers wired with the
 * seller-valid family of middlewares (location, shipping-option,
 * add-item).
 */
export const orderIdFromClaimParam: OrderIdResolver = async (req) => {
  const claimId = (req.params as { id?: string })?.id
  if (!claimId) return null
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order_claim",
    fields: ["id", "order_id"],
    filters: { id: claimId },
  })
  return (data[0] as { order_id?: string } | undefined)?.order_id ?? null
}

/**
 * Resolve the order id for `/admin/exchanges/:id/...` requests by looking
 * up the exchange's `order_id`. Used by all exchange matchers wired with
 * the seller-valid family of middlewares.
 */
export const orderIdFromExchangeParam: OrderIdResolver = async (req) => {
  const exchangeId = (req.params as { id?: string })?.id
  if (!exchangeId) return null
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order_exchange",
    fields: ["id", "order_id"],
    filters: { id: exchangeId },
  })
  return (data[0] as { order_id?: string } | undefined)?.order_id ?? null
}
