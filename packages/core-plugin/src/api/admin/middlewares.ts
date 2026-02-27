import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { adminPayoutsMiddlewares } from "./payouts/middlewares"
import { adminSellersMiddlewares } from "./sellers/middlewares"
import { adminCommissionRatesMiddlewares } from "./commission-rates/middlewares"
import { AdminGetProductsParams } from "./products/validators"
import { listProductQueryConfig } from "@medusajs/medusa/api/admin/products/query-config"
import { AdminGetOrdersParams } from "./orders/validators"
import { listTransformQueryConfig as listOrderQueryConfig } from "@medusajs/medusa/api/admin/orders/query-config"

const maybeApplySellerProductFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.filterableFields.seller_id) {
    return next()
  }

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
  if (!req.filterableFields.seller_id) {
    return next()
  }

  return maybeApplyLinkFilter({
    entryPoint: "order_seller",
    resourceId: "order_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminOrderGroupsMiddlewares,
  ...adminPayoutsMiddlewares,
  ...adminSellersMiddlewares,
  ...adminCommissionRatesMiddlewares,
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductsParams,
        listProductQueryConfig
      ),
      maybeApplySellerProductFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/orders",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrdersParams,
        listOrderQueryConfig
      ),
      maybeApplySellerOrderFilter,
    ],
  },
]
