import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REVIEW_MODULE } from '../../../modules/reviews'
import ReviewModuleService from '../../../modules/reviews/service'
import { CreateReviewDTO } from '../../../modules/reviews/types'

export const createReviewStep = createStep(
  'create-review',
  async (input: CreateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const review = await service.createReviews(input)

    await link.create([
      {
        [Modules.CUSTOMER]: {
          customer_id: input.customer_id
        },
        [REVIEW_MODULE]: {
          review_id: review.id
        }
      }
    ])
    return new StepResponse(review)
  }
)
