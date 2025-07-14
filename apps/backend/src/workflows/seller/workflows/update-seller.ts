import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateSellerDTO } from '@mercurjs/framework'

import { updateSellerStep } from '../steps'

/**
 * Updates seller information and returns the modified seller.
 */
export const updateSellerWorkflow = createWorkflow(
  'update-seller',
  function (input: UpdateSellerDTO) {
    return new WorkflowResponse(updateSellerStep(input))
  }
)
