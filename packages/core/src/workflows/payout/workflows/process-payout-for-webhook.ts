import { createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutStatus, PayoutWebhookResult } from "@mercurjs/types"

import { updatePayoutsStep } from "../steps"
import { syncPayoutAccountWorkflow } from "./sync-payout-account"

export type ProcessPayoutForWebhookWorkflowInput = PayoutWebhookResult

export const processPayoutForWebhookWorkflowId = "process-payout-for-webhook"

const STATUS_BY_ACTION: Record<string, PayoutStatus> = {
  "payout.paid": PayoutStatus.PAID,
  "payout.failed": PayoutStatus.FAILED,
}

/**
 * Applies a provider webhook: an `account.*` event re-syncs the account, a
 * `payout.*` event moves the payout to its final status.
 */
export const processPayoutForWebhookWorkflow = createWorkflow(
  processPayoutForWebhookWorkflowId,
  function (input: ProcessPayoutForWebhookWorkflowInput) {
    const accounts = when(
      "account-webhook",
      { input },
      ({ input }) => input.action.startsWith("account.") && !!input.data?.id
    ).then(() => {
      const { data } = useQueryGraphStep({
        entity: "payout_account",
        fields: ["id"],
        filters: transform({ input }, ({ input }) => ({ external_id: input.data?.id as string })),
      }).config({ name: "webhook-account-query" })

      return data
    })

    when("known-account", { accounts }, ({ accounts }) => !!accounts?.length).then(() => {
      syncPayoutAccountWorkflow.runAsStep({
        input: transform({ accounts }, ({ accounts }) => ({ id: accounts![0].id })),
      })
    })

    const payouts = when(
      "payout-webhook",
      { input },
      ({ input }) => !!STATUS_BY_ACTION[input.action] && !!input.data?.payout_id
    ).then(() => {
      const { data } = useQueryGraphStep({
        entity: "payout",
        fields: ["id", "status_reason"],
        filters: transform({ input }, ({ input }) => ({ id: input.data?.payout_id as string })),
      }).config({ name: "webhook-payout-query" })

      return data
    })

    updatePayoutsStep(
      transform({ input, payouts }, ({ input, payouts }) =>
        (payouts ?? []).map((payout) => {
          const status = STATUS_BY_ACTION[input.action]
          return {
            id: payout.id,
            status,
            status_reason:
              status === PayoutStatus.FAILED
                ? ((input.data?.status_reason as string | undefined) ?? payout.status_reason)
                : null,
          }
        })
      )
    )
  }
)
