import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateComissionRateDTO } from '../../../modules/comission/types'
import { createComissionRateStep } from '../steps'

export const createComissionRateWorkflow = createWorkflow(
  'create-comission-rate',
  function (input: CreateComissionRateDTO) {
    return new WorkflowResponse(createComissionRateStep(input))
  }
)
