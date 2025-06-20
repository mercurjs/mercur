import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { syncStripeAccountStep } from '../steps'

export const syncStripeAccountWorkflow = createWorkflow(
  'sync-stripe-account',
  function (account_id: string) {
    return new WorkflowResponse(syncStripeAccountStep(account_id))
  }
)
