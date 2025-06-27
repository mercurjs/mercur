import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateSellerDTO } from '@mercurjs/framework'

import { updateSellerStep } from '../steps'

export const updateSellerWorkflow = createWorkflow(
  'update-seller',
  function (input: UpdateSellerDTO) {
    return new WorkflowResponse(updateSellerStep(input))
  }
)
