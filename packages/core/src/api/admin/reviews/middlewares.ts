import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { maybeApplyLinkFilter } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import customerReview from "../../../links/customer-review"
import sellerReview from "../../../links/seller-review"
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
      maybeApplyLinkFilter({
        entryPoint: sellerReview.entryPoint,
        resourceId: "review_id",
        filterableField: "seller_id",
      }),
      maybeApplyLinkFilter({
        entryPoint: customerReview.entryPoint,
        resourceId: "review_id",
        filterableField: "customer_id",
      }),
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
