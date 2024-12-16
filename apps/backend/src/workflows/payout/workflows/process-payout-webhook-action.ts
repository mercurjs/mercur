import { PayoutWebhookActionAndDataResponse } from '#/modules/payout/types'

import { createWorkflow } from '@medusajs/workflows-sdk'

type ProcessPayoutWebhookActionInput = {
  action: PayoutWebhookActionAndDataResponse['action']
  data: PayoutWebhookActionAndDataResponse['data']
}

export const processPayoutWebhookActionWorkflow = createWorkflow(
  'process-payout-action',
  function (input: ProcessPayoutWebhookActionInput) {
    // here we can implement following actions:
    // - send email with confirmation of payout
    // - send email about failed payout
    // - send email about account status change
  }
)
