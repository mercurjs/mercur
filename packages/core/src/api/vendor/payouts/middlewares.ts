import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorPayoutQueryConfig } from "./query-config"
import { VendorGetPayoutParams, VendorGetPayoutsParams } from "./validators"

const applySellerPayoutLinkFilter = applySellerLinkFilter()

export const vendorPayoutsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/payouts",
    middlewares: [
      requirePermission("payouts", "view"),
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
      requirePermission("payouts", "view"),
      validateAndTransformQuery(
        VendorGetPayoutParams,
        vendorPayoutQueryConfig.retrieve
      ),
    ],
  },
]
