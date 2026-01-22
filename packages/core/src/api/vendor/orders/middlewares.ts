import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorOrderQueryConfig } from "./query-config"
import { VendorGetOrderParams, VendorGetOrdersParams } from "./validators"

const applySellerLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_order",
    resourceId: "order_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorOrdersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/orders",
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrdersParams,
        vendorOrderQueryConfig.list
      ),
      applySellerLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
]
