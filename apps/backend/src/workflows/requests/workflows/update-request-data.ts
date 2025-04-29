import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateRequestDataDTO } from '../../../modules/requests/types'
import { updateRequestDataStep } from '../steps'

export const updateRequestDataWorkflow = createWorkflow(
  'update-request-data',
  function (input: UpdateRequestDataDTO) {
    return new WorkflowResponse(updateRequestDataStep(input))
  }
)
