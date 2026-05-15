import {
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/medusa"
import { SellerStatus } from "@mercurjs/types"

/**
 * Resolve sellers that are currently OPEN and not within an active
 * closure window, then expose their IDs as `seller_id` so the link
 * filter below can translate it into a product-id constraint via the
 * `product_seller` join entity.
 */
async function applyVisibleSellerIdsFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()

  const { data: visibleSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: {
      status: SellerStatus.OPEN,
      $and: [
        { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
        { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] },
      ],
    },
  })

  req.filterableFields ??= {}
  req.filterableFields.seller_id = visibleSellers.map(
    (s: { id: string }) => s.id
  )

  next()
}
export const storeProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/products",
    middlewares: [applyVisibleSellerIdsFilter, maybeApplyLinkFilter({
      entryPoint: "product_seller",
      resourceId: "product_id",
      filterableField: "seller_id",
    })],
  },
  {
    method: ["GET"],
    matcher: "/store/products/:id",
    middlewares: [applyVisibleSellerIdsFilter, maybeApplyLinkFilter({
      entryPoint: "product_seller",
      resourceId: "product_id",
      filterableField: "seller_id",
    })],
  },
]
