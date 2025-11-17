import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { syncPayoutAccountStep } from '../steps'

export const syncPayoutAccountWorkflow = createWorkflow(
  'sync-payout-account',
  function (account_id: string) {
    return new WorkflowResponse(syncPayoutAccountStep(account_id))
  }
)
