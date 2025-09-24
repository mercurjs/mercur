import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateRequestDataDTO } from '@mercurjs/framework'

import { updateRequestDataStep } from '../steps'

export const updateRequestDataWorkflow = createWorkflow(
  'update-request-data',
  function (input: UpdateRequestDataDTO) {
    return new WorkflowResponse(updateRequestDataStep(input))
  }
)
