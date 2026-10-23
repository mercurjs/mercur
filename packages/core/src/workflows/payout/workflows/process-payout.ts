import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents, PayoutStatus } from "@mercurjs/types"

import { dispatchPayoutStep } from "../steps/dispatch-payout"

export type ProcessPayoutWorkflowInput = {
  payout_id: string
}

export const processPayoutWorkflowId = "process-payout"

export const processPayoutWorkflow = createWorkflow(
  processPayoutWorkflowId,
  function (input: ProcessPayoutWorkflowInput) {
    const payout = dispatchPayoutStep({ payout_id: input.payout_id })

    const failure = transform({ payout }, ({ payout }) => ({
      failed: payout.status === PayoutStatus.FAILED,
      data: {
        id: payout.id,
        account_id: payout.account_id,
        settlement_id: payout.settlement_id,
        amount: payout.amount,
        currency_code: payout.currency_code,
        status: payout.status,
        status_reason: payout.status_reason,
        provider_payout_id: payout.provider_payout_id,
      },
    }))

    when(failure, ({ failed }) => failed).then(() => {
      emitEventStep({ eventName: PayoutModuleEvents.PAYOUT_FAILED, data: failure.data })
    })

    return new WorkflowResponse(payout)
  }
)
