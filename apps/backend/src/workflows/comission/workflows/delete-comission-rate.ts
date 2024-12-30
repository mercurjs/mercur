import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { deleteComissionRateStep } from '../steps/delete-comission-rate'

export const deleteComissionRateWorkflow = createWorkflow(
  'delete-comission-rate',
  function (id: string) {
    return new WorkflowResponse(deleteComissionRateStep(id))
  }
)
