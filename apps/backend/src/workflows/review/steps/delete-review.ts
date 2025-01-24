import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REVIEW_MODULE } from '../../../modules/reviews'
import ReviewModuleService from '../../../modules/reviews/service'

export const deleteReviewStep = createStep(
  'delete-review',
  async (id: string, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)

    await service.softDeleteReviews(id)

    return new StepResponse(id)
  }
)
