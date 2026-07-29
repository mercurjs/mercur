import { MedusaError } from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import ReviewModuleService from "../../../modules/review/service"

export const validateReviewResponseStep = createStep(
  "validate-review-response",
  async (reviewId: string, { container }) => {
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)

    const [review] = await service.listReviews({ id: reviewId })

    if (!review) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Review with id: ${reviewId} was not found`
      )
    }

    if (review.seller_note) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This review already has a response and it cannot be changed"
      )
    }
  }
)
