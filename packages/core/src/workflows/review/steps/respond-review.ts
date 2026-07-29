import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, RespondReviewDTO } from "@mercurjs/types"

import ReviewModuleService from "../../../modules/review/service"

export const respondReviewStep = createStep(
  "respond-review",
  async (input: RespondReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)

    const [review] = await service.listReviews({ id: input.id })

    if (!review) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Review not found")
    }

    if (review.seller_note) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This review already has a response"
      )
    }

    const updated = await service.updateReviews({
      id: input.id,
      seller_note: input.seller_note,
    })

    return new StepResponse(updated, input.id)
  },
  async (reviewId: string | undefined, { container }) => {
    if (!reviewId) {
      return
    }
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    await service.updateReviews({ id: reviewId, seller_note: null })
  }
)
