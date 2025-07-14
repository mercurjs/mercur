import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { deleteReviewWorkflow } from '../../review/workflows'
import { updateRequestWorkflow } from './update-request'

/**
 * Accepts review removal request and deletes the review.
 */
export const acceptReviewRemoveRequestWorkflow = createWorkflow(
  'accept-review-remove-request',
  function (input: AcceptRequestDTO) {
    const result = deleteReviewWorkflow.runAsStep({
      input: input.data.review_id
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(result)
  }
)
