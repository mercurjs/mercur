import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import { ReviewReference } from "@mercurjs/types"

import customerReview from "../../../links/customer-review"
import productReview from "../../../links/product-review"
import sellerReview from "../../../links/seller-review"
import {
  storePublicReviewQueryConfig,
  storeReviewQueryConfig,
} from "./query-config"
import {
  StoreCreateReview,
  StoreGetPublicReviewsParams,
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

/**
 * Scopes a public review listing to one product or seller. The reference and
 * status are pinned server-side so an unpublished review can never be reached
 * by passing them as query params.
 */
const applyPublicReviewFilters = (
  reference: ReviewReference,
  entryPoint: string,
  filterableField: string
) => {
  return (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    req.filterableFields[filterableField] = req.params.id
    req.filterableFields.reference = reference
    req.filterableFields.status = "published"

    return maybeApplyLinkFilter({
      entryPoint,
      resourceId: "review_id",
      filterableField,
    })(req, res, next)
  }
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
  {
    method: ["GET"],
    matcher: "/store/products/:id/reviews",
    middlewares: [
      validateAndTransformQuery(
        StoreGetPublicReviewsParams,
        storePublicReviewQueryConfig.list
      ),
      applyPublicReviewFilters(
        "product",
        productReview.entryPoint,
        "product_id"
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/sellers/:id/reviews",
    middlewares: [
      validateAndTransformQuery(
        StoreGetPublicReviewsParams,
        storePublicReviewQueryConfig.list
      ),
      applyPublicReviewFilters("seller", sellerReview.entryPoint, "seller_id"),
    ],
  },
]
