import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { Link } from "@medusajs/framework/modules-sdk"
import { CreateReviewDTO } from "@mercurjs/types"

import ReviewModuleService from "../../../modules/review/service"
import { MercurModules } from "@mercurjs/types"

export const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)

    const review = await service.createReviews({
      reference: input.reference,
      rating: input.rating,
      customer_note: input.customer_note ?? null,
    })

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
  async (reviewId: string | undefined, { container }) => {
    if (!reviewId) {
      return
    }
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    await service.deleteReviews(reviewId)
  }
)
