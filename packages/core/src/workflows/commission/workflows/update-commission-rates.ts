import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { UpdateCommissionRateDTO } from "@mercurjs/types"

import { updateCommissionRatesStep } from "../steps/update-commission-rates"

export const updateCommissionRatesWorkflowId = "update-commission-rates"

export const updateCommissionRatesWorkflow = createWorkflow(
  updateCommissionRatesWorkflowId,
  function (input: UpdateCommissionRateDTO[]) {
    const commissionRates = updateCommissionRatesStep(input)

    return new WorkflowResponse(commissionRates)
  }
)
