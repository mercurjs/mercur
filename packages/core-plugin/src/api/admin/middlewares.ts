import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { adminOrderGroupQueryConfig } from "./order-groups/query-config"
import { AdminGetOrderGroupParams } from "./order-groups/validators"
import { adminPayoutsMiddlewares } from "./payouts/middlewares"
import { adminSellersMiddlewares } from "./sellers/middlewares"
import { adminCommissionRatesMiddlewares } from "./commission-rates/middlewares"

const extractSellerIdFromQuery = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.query.seller_id
  if (sellerId) {
    delete req.query.seller_id
    ;(req as any).__seller_id = sellerId
  }
  next()
}

const injectSellerIdFilter = (
  entryPoint: string,
  resourceId: string
) => {
  return (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const sellerId = (req as any).__seller_id
    if (!sellerId) {
      return next()
    }

    delete (req as any).__seller_id
    req.filterableFields.seller_id = sellerId

    return maybeApplyLinkFilter({
      entryPoint,
      resourceId,
      filterableField: "seller_id",
    })(req, res, next)
  }
}

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminOrderGroupsMiddlewares,
  {
    method: ["GET"],
    matcher: "/admin/orders/:id/order-group",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderGroupParams,
        adminOrderGroupQueryConfig.retrieve
      ),
    ],
  },
  ...adminPayoutsMiddlewares,
  ...adminSellersMiddlewares,
  ...adminCommissionRatesMiddlewares,
  {
    matcher: "/admin/products",
    middlewares: [extractSellerIdFromQuery],
  },
  {
    matcher: "/admin/orders",
    middlewares: [extractSellerIdFromQuery],
  },
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [injectSellerIdFilter("product_seller", "product_id")],
  },
  {
    method: ["GET"],
    matcher: "/admin/orders",
    middlewares: [injectSellerIdFilter("order_seller", "order_id")],
  },
]
