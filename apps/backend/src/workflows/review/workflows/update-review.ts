import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { UpdateReviewDTO } from '../../../modules/reviews/types'
import { updateReviewStep } from '../steps'

export const updateReviewWorkflow = createWorkflow(
  {
    name: 'update-review'
  },
  function (input: UpdateReviewDTO) {
    return new WorkflowResponse(updateReviewStep(input))
  }
)
