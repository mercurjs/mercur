import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateCommissionRateDTO } from '../../../modules/commission/types'
import { createCommissionRateStep } from '../steps'

export const createCommissionRateWorkflow = createWorkflow(
  'create-commission-rate',
  function (input: CreateCommissionRateDTO) {
    return new WorkflowResponse(createCommissionRateStep(input))
  }
)
