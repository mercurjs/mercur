import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { CreateCommissionRateDTO } from "@mercurjs/types"

import { createCommissionRatesStep } from "../steps/create-commission-rates"

export const createCommissionRatesWorkflowId = "create-commission-rates"

export const createCommissionRatesWorkflow = createWorkflow(
  createCommissionRatesWorkflowId,
  function (input: CreateCommissionRateDTO[]) {
    const commissionRates = createCommissionRatesStep(input)

    return new WorkflowResponse(commissionRates)
  }
)
