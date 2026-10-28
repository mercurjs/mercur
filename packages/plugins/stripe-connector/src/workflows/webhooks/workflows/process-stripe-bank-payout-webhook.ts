import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import Stripe from "stripe"

import { setCheckpointsStep } from "../../common/steps"
import { updateSettlementBankPayoutStep } from "../steps"
import { BANK_PAYOUT_EVENTS, LAST_WEBHOOK_CHECKPOINT } from "../utils"

export type ProcessStripeBankPayoutWebhookWorkflowInput = {
  type: string
  received_at: string
  payout?: Pick<Stripe.Payout, "id" | "status" | "failure_code" | "failure_message"> | null
}

export const processStripeBankPayoutWebhookWorkflowId = "process-stripe-bank-payout-webhook"

/**
 * Records when a verified Connect webhook arrived and follows the bank
 * payouts of settlements, which core does not know about.
 */
export const processStripeBankPayoutWebhookWorkflow = createWorkflow(
  processStripeBankPayoutWebhookWorkflowId,
  function (input: ProcessStripeBankPayoutWebhookWorkflowInput) {
    setCheckpointsStep(
      transform({ input }, ({ input }) => [{ key: LAST_WEBHOOK_CHECKPOINT, value: input.received_at }])
    )

    const settlement = when(
      "bank-payout-webhook",
      { input },
      ({ input }) => BANK_PAYOUT_EVENTS.includes(input.type) && !!input.payout
    ).then(() =>
      updateSettlementBankPayoutStep(
        transform({ input }, ({ input }) => {
          const payout = input.payout as NonNullable<ProcessStripeBankPayoutWebhookWorkflowInput["payout"]>
          return {
            provider_payout_id: payout.id,
            status: payout.status,
            status_reason: payout.failure_code
              ? `${payout.failure_code}: ${payout.failure_message ?? "Unknown failure reason"}`
              : null,
          }
        })
      )
    )

    return new WorkflowResponse(transform({ settlement }, ({ settlement }) => settlement ?? null))
  }
)
