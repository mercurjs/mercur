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
import { adminSubscriptionPlanRoutesMiddlewares } from "./subscription-plans/middlewares"

const maybeApplySellerProductFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "product_seller",
    resourceId: "product_id",
    filterableField: "seller_id",
  })(req, res, next)
}

const maybeApplySellerOrderFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "order_seller",
    resourceId: "order_id",
    filterableField: "seller_id",
  })(req, res, next)
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
  ...adminSubscriptionPlanRoutesMiddlewares,
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
      maybeApplySellerProductFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/orders",
    middlewares: [
      maybeApplySellerOrderFilter,
    ],
  },
]
