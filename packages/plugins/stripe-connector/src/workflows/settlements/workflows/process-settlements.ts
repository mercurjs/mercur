import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { StripeConnectorEvents } from "../../../types/common"
import { JobStats } from "../../../utils/run-job"
import {
  createSettlementsStep,
  loadSettlementSourcesStep,
  processAdjustmentsStep,
  processSettlementPayoutsStep,
  retrySettlementPayoutsStep,
} from "../steps"
import { LoadSettlementSourcesStepInput } from "../steps/load-settlement-sources"
import { planSettlements } from "../utils/plan-settlements"

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
    const sellerLinks = when("settlements-of-one-seller", { input }, ({ input }) => !!input.seller_id).then(() => {
      const { data } = useQueryGraphStep({
        entity: "seller_payout_account",
        fields: ["payout_account_id"],
        filters: { seller_id: input.seller_id },
      }).config({ name: "settlement-seller-accounts-query" })
      return data
    })

    const accountIds = transform({ input, sellerLinks }, ({ input, sellerLinks }) =>
      input.seller_id ? (sellerLinks ?? []).map((link) => link.payout_account_id as string) : null
    )

    const accounts = when("settlement-accounts", { accountIds }, ({ accountIds }) => !accountIds || accountIds.length > 0).then(
      () => {
        const { data } = useQueryGraphStep({
          entity: "payout_account",
          fields: ["id", "external_id", "payouts_enabled", "created_at", "seller.id"],
          filters: transform({ accountIds }, ({ accountIds }) => (accountIds ? { id: accountIds } : {})),
        }).config({ name: "settlement-accounts-query" })
        return data
      }
    )

    const adjustmentsProcessed = processAdjustmentsStep()
    const payoutsRetried = retrySettlementPayoutsStep({ account_ids: accountIds })

    const loaded = loadSettlementSourcesStep(
      transform({ accounts }, ({ accounts }): LoadSettlementSourcesStepInput => ({
        accounts: (accounts ?? []) as unknown as LoadSettlementSourcesStepInput["accounts"],
      }))
    )

    const plan = transform({ input, loaded }, ({ input, loaded }) =>
      planSettlements(
        loaded.sources,
        new Date(Math.max(new Date(input.now ?? Date.now()).getTime(), Date.now())),
        loaded.mode
      )
    )

    const created = createSettlementsStep(plan.settlements)
    const processed = processSettlementPayoutsStep({ settlements: created })

    emitEventStep({
      eventName: StripeConnectorEvents.SETTLEMENT_CREATED,
      data: transform({ created }, ({ created }) =>
        created.map((settlement) => ({
          id: settlement.id,
          account_id: settlement.account_id,
          seller_id: settlement.seller_id,
          currency_code: settlement.currency_code,
          amount: settlement.amount,
        }))
      ),
    })

    emitEventStep({
      eventName: StripeConnectorEvents.SETTLEMENT_PAYOUT_FAILED,
      data: transform({ payoutsRetried, processed }, ({ payoutsRetried, processed }) =>
        [...payoutsRetried.failed_ids, ...processed.failed_ids].map((id) => ({ id }))
      ),
    }).config({ name: "emit-settlement-payout-failed" })

    const stats = transform(
      { plan, adjustmentsProcessed, payoutsRetried, processed },
      ({ plan, adjustmentsProcessed, payoutsRetried, processed }): JobStats => ({
        ...plan.counts,
        adjustments_processed: adjustmentsProcessed,
        payouts_retried: payoutsRetried.sent,
        payouts: processed.sent,
      })
    )

    return new WorkflowResponse(stats)
  }
)
