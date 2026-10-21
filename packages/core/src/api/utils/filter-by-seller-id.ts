import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * Scopes a list query to the authenticated seller by nesting the seller id
 * under the given relation path, e.g. `["seller"]` becomes
 * `filters.seller.id`, `["order", "seller"]` becomes `filters.order.seller.id`.
 *
 * Medusa compiles a nested filter on a link relation into a correlated
 * `EXISTS` subquery on the root entity, so the whole scope stays in SQL and
 * no link rows are materialised. That only happens when the path sits at the
 * top level of `filters` (never under `$and` / `$or`) and every hop is a link
 * or module-internal relation — keep it that way when extending a path.
 */
export const applySellerLinkFilter =
  (path: string[] = ["seller"]) =>
  (
    req: AuthenticatedMedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    req.filterableFields ??= {}

    let cursor = req.filterableFields as Record<string, unknown>
    for (const segment of path) {
      const existing = cursor[segment]
      const nested: Record<string, unknown> =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? (existing as Record<string, unknown>)
          : {}
      cursor[segment] = nested
      cursor = nested
    }

    cursor.id = req.seller_context!.seller_id

    return next()
  }

export function filterBySellerId() {
  return (
    req: AuthenticatedMedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    req.filterableFields.seller_id = req.seller_context!.seller_id
    next()
  }
}
