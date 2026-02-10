import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorPayoutQueryConfig } from "./query-config"
import { VendorGetPayoutParams, VendorGetPayoutsParams } from "./validators"

const applySellerPayoutLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "payout_seller",
    resourceId: "payout_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorPayoutsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/payouts",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPayoutsParams,
        vendorPayoutQueryConfig.list
      ),
      applySellerPayoutLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payouts/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPayoutParams,
        vendorPayoutQueryConfig.retrieve
      ),
    ],
  },
]
