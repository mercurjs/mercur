import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdateReviewDTO } from "@mercurjs/types"

import ReviewModuleService from "../../../modules/review/service"

export const updateReviewStep = createStep(
  "update-review",
  async (input: UpdateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)

    const [previous] = await service.listReviews({ id: input.id })

    const review = await service.updateReviews(input)

    return new StepResponse(review, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    await service.updateReviews({
      id: previous.id,
      rating: previous.rating,
      customer_note: previous.customer_note,
      seller_note: previous.seller_note,
      status: previous.status,
    })
  }
)
