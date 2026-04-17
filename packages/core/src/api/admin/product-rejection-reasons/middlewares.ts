import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminProductRejectionReasonQueryConfig } from "./query-config"
import {
  AdminCreateProductRejectionReason,
  AdminGetProductRejectionReasonParams,
  AdminGetProductRejectionReasonsParams,
  AdminUpdateProductRejectionReason,
} from "./validators"

export const adminProductRejectionReasonsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/product-rejection-reasons",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductRejectionReasonsParams,
        adminProductRejectionReasonQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-rejection-reasons",
    middlewares: [
      validateAndTransformBody(AdminCreateProductRejectionReason),
      validateAndTransformQuery(
        AdminGetProductRejectionReasonParams,
        adminProductRejectionReasonQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-rejection-reasons/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductRejectionReasonParams,
        adminProductRejectionReasonQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-rejection-reasons/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductRejectionReason),
      validateAndTransformQuery(
        AdminGetProductRejectionReasonParams,
        adminProductRejectionReasonQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-rejection-reasons/:id",
    middlewares: [],
  },
]
