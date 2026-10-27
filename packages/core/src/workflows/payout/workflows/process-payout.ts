import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutDTO, PayoutModuleEvents, PayoutStatus } from "@mercurjs/types"

import { dispatchPayoutsStep } from "../steps/dispatch-payout"

export type ProcessPayoutWorkflowInput = {
  payout_ids: string[]
}

export const processPayoutWorkflowId = "process-payout"

export const failedPayoutEvents = (payouts: PayoutDTO[]) =>
  payouts
    .filter((payout) => payout.status === PayoutStatus.FAILED)
    .map((payout) => ({
      id: payout.id,
      account_id: payout.account_id,
      order_id: payout.order_id,
      amount: payout.amount,
      currency_code: payout.currency_code,
      status: payout.status,
      status_reason: payout.status_reason,
    }))

/**
 * Sends pending or failed payouts to the provider. This is the retry path:
 * a payout that is paid, processing or aborted is returned unchanged.
 */
export const processPayoutWorkflow = createWorkflow(
  processPayoutWorkflowId,
  function (input: ProcessPayoutWorkflowInput) {
    const payouts = dispatchPayoutsStep({ payout_ids: input.payout_ids })

    const failed = transform({ payouts }, ({ payouts }) => failedPayoutEvents(payouts))

    emitEventStep({ eventName: PayoutModuleEvents.PAYOUT_FAILED, data: failed })

    return new WorkflowResponse(payouts)
  }
)
