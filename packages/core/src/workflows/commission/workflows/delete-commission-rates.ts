import {
  createHook,
  createWorkflow,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { deleteCommissionRatesStep } from "../steps/delete-commission-rates"

export type DeleteCommissionRatesWorkflowInput = {
  ids: string[]
}

export const deleteCommissionRatesWorkflowId = "delete-commission-rates"

export const deleteCommissionRatesWorkflow = createWorkflow(
  deleteCommissionRatesWorkflowId,
  (input: WorkflowData<DeleteCommissionRatesWorkflowInput>) => {
    const deletedCommissionRates = deleteCommissionRatesStep(input.ids)

    const commissionRatesDeleted = createHook("commissionRatesDeleted", {
      ids: input.ids,
    })

    return new WorkflowResponse(deletedCommissionRates, {
      hooks: [commissionRatesDeleted],
    })
  }
)
