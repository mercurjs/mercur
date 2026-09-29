import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorRefundReasonQueryConfig } from "./query-config"
import {
  VendorGetRefundReasonParams,
  VendorGetRefundReasonsParams,
} from "./validators"

export const vendorRefundReasonsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/refund-reasons",
    middlewares: [
      requirePermission("refund_reasons", "view"),
      validateAndTransformQuery(
        VendorGetRefundReasonsParams,
        vendorRefundReasonQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/refund-reasons/:id",
    middlewares: [
      requirePermission("refund_reasons", "view"),
      validateAndTransformQuery(
        VendorGetRefundReasonParams,
        vendorRefundReasonQueryConfig.retrieve
      ),
    ],
  },
]
