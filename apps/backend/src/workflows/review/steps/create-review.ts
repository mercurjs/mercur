import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { CreateReviewDTO } from '@mercurjs/framework'
import { REVIEW_MODULE, ReviewModuleService } from '@mercurjs/reviews'

export const createReviewStep = createStep(
  'create-review',
  async (input: CreateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const review = await service.createReviews(input)

    await link.create([
      {
        [Modules.CUSTOMER]: {
          customer_id: input.customer_id
        },
        [REVIEW_MODULE]: {
          review_id: review.id
        }
      },
      {
        [Modules.ORDER]: {
          order_id: input.order_id
        },
        [REVIEW_MODULE]: {
          review_id: review.id
        }
      }
    ])
    return new StepResponse(review)
  }
)
