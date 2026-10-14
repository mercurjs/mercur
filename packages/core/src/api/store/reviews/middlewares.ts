import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import customerReview from "../../../links/customer-review"
import { storeReviewQueryConfig } from "./query-config"
import {
  StoreCreateReview,
  StoreGetReviewsParams,
  StoreUpdateReview,
} from "./validators"

const applyCustomerReviewLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.customer_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: customerReview.entryPoint,
    resourceId: "review_id",
    filterableField: "customer_id",
  })(req, res, next)
}

export const storeReviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.list
      ),
      applyCustomerReviewLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreCreateReview),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/reviews/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/reviews/:id",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["POST"],
    matcher: "/store/reviews/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreUpdateReview),
    ],
  },
]
