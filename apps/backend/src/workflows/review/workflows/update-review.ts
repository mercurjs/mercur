import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'
import { emitEventStep } from '@medusajs/medusa/core-flows'

import { UpdateReviewDTO } from '@mercurjs/framework'

import { AlgoliaEvents } from '../../../modules/algolia/types'
import { updateReviewStep } from '../steps'

export const updateReviewWorkflow = createWorkflow(
  {
    name: 'update-review'
  },
  function (input: UpdateReviewDTO) {
    const review = updateReviewStep(input)
    emitEventStep({
      eventName: AlgoliaEvents.REVIEW_CHANGED,
      data: { review }
    })
    return new WorkflowResponse(review)
  }
)
