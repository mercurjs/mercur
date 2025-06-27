import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REVIEW_MODULE, ReviewModuleService } from '@mercurjs/reviews'

export const deleteReviewStep = createStep(
  'delete-review',
  async (id: string, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)

    await service.softDeleteReviews(id)

    return new StepResponse(id)
  }
)
