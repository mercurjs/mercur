import { requirePermission } from "../../utils"
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
      requirePermission("return_reasons", "view"),
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
      requirePermission("return_reasons", "view"),
      validateAndTransformQuery(
        VendorGetReturnReasonParams,
        vendorReturnReasonQueryConfig.retrieve
      ),
    ],
  },
]
