import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { UpdateReviewDTO } from '@mercurjs/framework'
import { REVIEW_MODULE, ReviewModuleService } from '@mercurjs/reviews'

export const updateReviewStep = createStep(
  'update-review',
  async (input: UpdateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)

    const review = await service.updateReviews(input)

    return new StepResponse(review)
  }
)
