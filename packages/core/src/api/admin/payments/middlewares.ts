import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import {
  Entities,
  retrieveTransformQueryConfig,
} from "@medusajs/medusa/api/admin/payments/query-config"
import { AdminGetPaymentParams } from "@medusajs/medusa/api/admin/payments/validators"

import { withOriginalMiddlewares } from "../../../utils/disable-medusa-middlewares"
import { AdminCreatePaymentRefund } from "./validators"

const overrides: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/payments/:id/refund",
    middlewares: [
      validateAndTransformBody(AdminCreatePaymentRefund),
      validateAndTransformQuery(
        AdminGetPaymentParams,
        retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.refund,
        operation: PolicyOperation.create,
      },
    ],
  },
]

export const adminPaymentsMiddlewares = withOriginalMiddlewares(
  "dist/api/admin/payments/middlewares.js",
  overrides
)
