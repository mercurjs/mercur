import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.review,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.review,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.review,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.review,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/reviews/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.review,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
