import { createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutStatus, PayoutStatusReason, PayoutWebhookResult } from "@mercurjs/types"

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
 * `payout.*` event moves the payout to its final status and stores the
 * provider's id for the payout, which a later reversal needs.
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
        fields: ["id", "data"],
        filters: transform({ input }, ({ input }) => ({ id: input.data?.payout_id as string })),
      }).config({ name: "webhook-payout-query" })

      return data
    })

    updatePayoutsStep(
      transform({ input, payouts }, ({ input, payouts }) =>
        (payouts ?? []).map((payout) => {
          const status = STATUS_BY_ACTION[input.action]
          const data = (payout.data ?? {}) as Record<string, unknown>
          const provider = (data.provider ?? {}) as Record<string, unknown>

          return {
            id: payout.id,
            status,
            status_reason: status === PayoutStatus.FAILED ? PayoutStatusReason.PROVIDER_ERROR : null,
            data: {
              ...data,
              provider: { ...provider, id: input.data?.id ?? provider.id },
              status_detail:
                status === PayoutStatus.FAILED ? (input.data?.status_reason ?? data.status_detail ?? null) : null,
              // The provider failed the payout it made under this key, so the
              // retry must not get that payout back.
              ...(status === PayoutStatus.FAILED ? { idempotency_key: null } : {}),
            },
          }
        })
      )
    )
  }
)
