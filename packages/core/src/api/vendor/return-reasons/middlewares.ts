import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.return_reason,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.return_reason,
        operation: PolicyOperation.read,
      },
    ],
  },
]
