import { when } from '@medusajs/framework/workflows-sdk'
import { createWorkflow } from '@medusajs/workflows-sdk'

import {
  PayoutAccountStatus,
  PayoutWebhookAction,
  PayoutWebhookActionAndDataResponse
} from '@mercurjs/framework'

import { updatePayoutAccountStep } from '../steps'

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

    when(
      { action: input.action },
      ({ action }) => action === PayoutWebhookAction.ACCOUNT_AUTHORIZED
    ).then(() => {
      updatePayoutAccountStep({
        id: input.data.account_id,
        status: PayoutAccountStatus.ACTIVE
      })
    })
  }
)
