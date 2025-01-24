import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { deleteCommissionRateStep } from '../steps/delete-commission-rate'

export const deleteCommissionRateWorkflow = createWorkflow(
  'delete-commission-rate',
  function (id: string) {
    return new WorkflowResponse(deleteCommissionRateStep(id))
  }
)
