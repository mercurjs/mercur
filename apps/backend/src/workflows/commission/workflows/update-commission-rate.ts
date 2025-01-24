import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateCommissionRateDTO } from '../../../modules/commission/types'
import { updateComissionRateStep } from '../steps'

export const updateCommissionRateWorkflow = createWorkflow(
  'update-commission-rate',
  function (input: UpdateCommissionRateDTO) {
    return new WorkflowResponse(updateComissionRateStep(input))
  }
)
