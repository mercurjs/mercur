import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { StripeConnectorEvents } from "../../../types/common"
import { createSettlementPayoutStep, validateSettlementPayoutRetryStep } from "../steps"
import { ValidateSettlementPayoutRetryStepInput } from "../steps/validate-settlement-payout-retry"
import { isSettlementPayoutUnpaid } from "../utils/settlement-payout"

export type RetrySettlementPayoutWorkflowInput = {
  id: string
}

export const retrySettlementPayoutWorkflowId = "retry-stripe-settlement-payout"

/** Sends a settlement's failed, held or unanswered bank payout again, on the operator's call. */
export const retrySettlementPayoutWorkflow = createWorkflow(
  retrySettlementPayoutWorkflowId,
  function (input: RetrySettlementPayoutWorkflowInput) {
    const { data: settlement } = useQueryGraphStep({
      entity: "settlement",
      fields: [
        "id",
        "payout_status",
        "provider_payout_id",
        "payout_account.id",
        "payout_account.external_id",
        "payout_account.payouts_enabled",
      ],
      filters: { id: input.id },
      options: { isList: false, throwIfKeyNotFound: true },
    }).config({ name: "retry-settlement-query" })

    const validated = transform(
      { settlement },
      ({ settlement }) => ({ settlement }) as unknown as ValidateSettlementPayoutRetryStepInput
    )
    validateSettlementPayoutRetryStep(validated)

    const updated = createSettlementPayoutStep(
      transform({ validated }, ({ validated }) => ({
        settlement_id: validated.settlement.id,
        stripe_account_id: validated.settlement.payout_account?.external_id as string,
      }))
    )

    emitEventStep({
      eventName: StripeConnectorEvents.SETTLEMENT_PAYOUT_FAILED,
      data: transform({ updated }, ({ updated }) =>
        isSettlementPayoutUnpaid(updated) ? [{ id: updated.id }] : []
      ),
    })

    return new WorkflowResponse(updated)
  }
)
