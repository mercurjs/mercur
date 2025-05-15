import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { listCommissionLinesStep } from '../steps'

export const listOrderCommissionLinesWorkflow = createWorkflow(
  'list-order-commission-lines',
  function (input: { order_id: string }) {
    return new WorkflowResponse(listCommissionLinesStep(input))
  }
)
