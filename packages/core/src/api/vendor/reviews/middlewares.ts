import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorReviewQueryConfig } from "./query-config"
import { VendorGetReviewsParams, VendorRespondReview } from "./validators"

const applySellerReviewLinkFilter = applySellerLinkFilter()

export const vendorReviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/reviews",
    middlewares: [
      requirePermission("reviews", "view"),
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.list
      ),
      applySellerReviewLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/reviews/:id",
    middlewares: [
      requirePermission("reviews", "view"),
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reviews/:id",
    middlewares: [
      requirePermission("reviews", "edit"),
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorRespondReview),
    ],
  },
]
