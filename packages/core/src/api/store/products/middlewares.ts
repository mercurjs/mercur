import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import { SellerStatus } from "@mercurjs/types"

/**
 * Restrict storefront product listings and detail lookups to products
 * belonging to sellers that are currently OPEN and not within an active
 * time-off window. Applied after Medusa's built-in validators so the
 * generated filterableFields are already populated.
 */
function applySellerVisibilityFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const now = new Date()

  const filterableFields = (req.filterableFields ??= {} as Record<
    string,
    any
  >)

  const sellerFilter = (filterableFields.seller ??= {}) as Record<string, any>
  sellerFilter.status = SellerStatus.OPEN

  const sellerAnd = (sellerFilter.$and ??= []) as any[]
  sellerAnd.push(
    { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
    { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] }
  )

  next()
}

export const storeProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/products",
    middlewares: [applySellerVisibilityFilter],
  },
  {
    method: ["GET"],
    matcher: "/store/products/:id",
    middlewares: [applySellerVisibilityFilter],
  },
]
