import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

import { CreateReviewDTO } from "../../../modules/review"
import ReviewModuleService from "../../../modules/review/service"

export const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)

    const review = await service.createReviews(input)

    await link.create([
      {
        [Modules.CUSTOMER]: {
          customer_id: input.customer_id,
        },
        [MercurModules.REVIEW]: {
          review_id: review.id,
        },
      },
      {
        [Modules.ORDER]: {
          order_id: input.order_id,
        },
        [MercurModules.REVIEW]: {
          review_id: review.id,
        },
      },
    ])

    return new StepResponse(review, review.id)
  },
  async (reviewId, { container }) => {
    if (!reviewId) {
      return
    }

    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    await service.deleteReviews(reviewId)
  }
)
