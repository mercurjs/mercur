import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { StripeConnectorEvents } from "../../../types/common"
import { createSettlementsStep } from "../steps/create-settlements"
import { dispatchAdjustmentsStep } from "../steps/dispatch-adjustments"
import { dispatchSettlementPayoutsStep } from "../steps/dispatch-settlement-payouts"
import { retrySettlementPayoutsStep } from "../steps/retry-settlement-payouts"
import { selectSettlementAccountsStep } from "../steps/select-settlement-accounts"
import { JobStats } from "../../../utils/run-job"

export type ProcessSettlementsWorkflowInput = {
  seller_id?: string
  now?: Date
}

export const processSettlementsWorkflowId = "process-stripe-settlements"

/**
 * Sends operator adjustments, retries held bank payouts, then nets each
 * account's paid lines into a settlement and pays it out to the seller's bank.
 */
export const processSettlementsWorkflow = createWorkflow(
  processSettlementsWorkflowId,
  function (input: ProcessSettlementsWorkflowInput) {
    const accountIds = selectSettlementAccountsStep({ seller_id: input.seller_id })

    const adjustmentsDispatched = dispatchAdjustmentsStep()
    const payoutsRetried = retrySettlementPayoutsStep({ account_ids: accountIds })

    const createInput = transform({ input, accountIds }, ({ input, accountIds }) => ({
      account_ids: accountIds,
      now: input.now ?? new Date(),
    }))
    const created = createSettlementsStep(createInput)

    const dispatched = dispatchSettlementPayoutsStep({ settlements: created.settlements })

    const events = transform({ created }, ({ created }) =>
      created.settlements.map((settlement) => ({
        id: settlement.id,
        account_id: settlement.account_id,
        seller_id: settlement.seller_id,
        currency_code: settlement.currency_code,
        amount: settlement.amount,
      }))
    )
    emitEventStep({ eventName: StripeConnectorEvents.SETTLEMENT_CREATED, data: events })

    const stats = transform(
      { created, adjustmentsDispatched, payoutsRetried, dispatched },
      ({ created, adjustmentsDispatched, payoutsRetried, dispatched }): JobStats => ({
        ...created.counts,
        adjustments_dispatched: adjustmentsDispatched,
        payouts_retried: payoutsRetried,
        payouts: dispatched,
      })
    )

    return new WorkflowResponse(stats)
  }
)
