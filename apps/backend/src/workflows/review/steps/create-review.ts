import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REVIEW_MODULE } from '../../../modules/reviews'
import ReviewModuleService from '../../../modules/reviews/service'
import { CreateReviewDTO } from '../../../modules/reviews/types'

export const createReviewStep = createStep(
  'create-review',
  async (input: CreateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)

    const review = await service.createReviews(input)

    return new StepResponse(review)
  }
)
