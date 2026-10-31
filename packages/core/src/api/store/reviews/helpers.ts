import { MedusaContainer } from "@medusajs/framework"
import {
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { ReviewReference, StoreReviewListResponse } from "@mercurjs/types"

import customerReview from "../../../links/customer-review"
import { StoreGetPublicReviewsParamsType } from "./validators"

export const validateCustomerReview = async (
  scope: MedusaContainer,
  customerId: string,
  reviewId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customerReviewLink],
  } = await query.graph({
    entity: customerReview.entryPoint,
    filters: {
      customer_id: customerId,
      review_id: reviewId,
    },
    fields: ["customer_id", "review_id"],
  })

  if (!customerReviewLink) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Review with id: ${reviewId} was not found`
    )
  }
}

export const applyPublicReviewFilters = (
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

export const listPublishedReviews = async (
  req: MedusaRequest<StoreGetPublicReviewsParamsType>,
  res: MedusaResponse<StoreReviewListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: reviews, metadata } = await query.graph({
    entity: "review",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    reviews,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
