import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { calculateCommissionLinesStep } from '../steps/calculate-commission-lines'
import { createCommissionLinesStep } from '../steps/create-commission-lines'

type WorkflowInput = {
  order_id: string
  seller_id: string
}

export const calculateCommissionWorkflow = createWorkflow(
  'calculate-commission-workflow',
  function (input: WorkflowInput) {
    const lines = calculateCommissionLinesStep(input)

    return new WorkflowResponse(createCommissionLinesStep(lines))
  }
)
