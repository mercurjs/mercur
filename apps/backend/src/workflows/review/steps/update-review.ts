import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REVIEW_MODULE } from '../../../modules/reviews'
import ReviewModuleService from '../../../modules/reviews/service'
import { UpdateReviewDTO } from '../../../modules/reviews/types'

export const updateReviewStep = createStep(
  'update-review',
  async (input: UpdateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)

    const review = await service.updateReviews(input)

    return new StepResponse(review)
  }
)
