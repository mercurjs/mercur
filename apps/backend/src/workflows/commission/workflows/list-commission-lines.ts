import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { listCommissionLinesStep } from '../steps'

type Input = {
  expand: boolean
  pagination: {
    skip: number
    take: number
  }
  filters: {
    start_date?: Date
    end_date?: Date
    seller_id?: string
  }
}

export const listCommissionLinesWorkflow = createWorkflow(
  'list-commission-lines',
  function (input: Input) {
    return new WorkflowResponse(listCommissionLinesStep(input))
  }
)
