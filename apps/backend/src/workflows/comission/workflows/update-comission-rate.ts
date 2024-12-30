import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateComissionRateDTO } from '../../../modules/comission/types'
import { updateComissionRateStep } from '../steps'

export const updateComissionRateWorkflow = createWorkflow(
  'update-comission-rate',
  function (input: UpdateComissionRateDTO) {
    return new WorkflowResponse(updateComissionRateStep(input))
  }
)
