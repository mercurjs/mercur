import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.refund_reason,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.refund_reason,
        operation: PolicyOperation.read,
      },
    ],
  },
]
