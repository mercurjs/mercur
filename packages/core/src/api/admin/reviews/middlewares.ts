import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { adminReviewsConfig } from "./query-config"
import {
  AdminGetReviewsParams,
  AdminRespondReview,
  AdminUpdateReview,
} from "./validators"

export const adminReviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/reviews",
    middlewares: [
      validateAndTransformQuery(AdminGetReviewsParams, adminReviewsConfig.list),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/reviews/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetReviewsParams,
        adminReviewsConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/reviews/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetReviewsParams,
        adminReviewsConfig.retrieve
      ),
      validateAndTransformBody(AdminUpdateReview),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/reviews/:id/respond",
    middlewares: [
      validateAndTransformQuery(
        AdminGetReviewsParams,
        adminReviewsConfig.retrieve
      ),
      validateAndTransformBody(AdminRespondReview),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/reviews/:id",
    middlewares: [],
  },
]
