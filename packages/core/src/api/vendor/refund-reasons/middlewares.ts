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
      validateAndTransformQuery(
        VendorGetRefundReasonParams,
        vendorRefundReasonQueryConfig.retrieve
      ),
    ],
  },
]
