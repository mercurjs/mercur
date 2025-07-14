import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { deleteReviewStep } from '../steps'

/**
 * Deletes a review and returns the deleted review.
 */
export const deleteReviewWorkflow = createWorkflow(
  {
    name: 'delete-review'
  },
  function (id: string) {
    return new WorkflowResponse(deleteReviewStep(id))
  }
)
