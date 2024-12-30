import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { calculateComissionLinesStep } from '../steps/calculate-comission-lines'
import { createComissionLinesStep } from '../steps/create-comission-lines'

type WorkflowInput = {
  order_id: string
  seller_id: string
}

export const calculateComissionWorkflow = createWorkflow(
  'calculate-comission-workflow',
  function (input: WorkflowInput) {
    const lines = calculateComissionLinesStep(input)

    return new WorkflowResponse(createComissionLinesStep(lines))
  }
)
