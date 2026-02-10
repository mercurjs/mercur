import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorReturnReasonQueryConfig } from "./query-config"
import {
  VendorGetReturnReasonParams,
  VendorGetReturnReasonsParams,
} from "./validators"

export const vendorReturnReasonsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/return-reasons",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnReasonsParams,
        vendorReturnReasonQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/return-reasons/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnReasonParams,
        vendorReturnReasonQueryConfig.retrieve
      ),
    ],
  },
]
