import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { resolveAlertingStep, sendOperatorEmailsStep } from "../../common/steps"
import { KycAttention, kycAttentionNotifications, needsKycAttention } from "../utils/kyc-attention"

export type NotifyKycAttentionWorkflowInput = {
  account_ids: string[]
}

export const notifyKycAttentionWorkflowId = "notify-stripe-kyc-attention"

/** Mails the technical contact the given payout accounts whose KYC is not approved. */
export const notifyKycAttentionWorkflow = createWorkflow(
  notifyKycAttentionWorkflowId,
  function (input: NotifyKycAttentionWorkflowInput) {
    const accounts = when("kyc-accounts-to-check", { input }, ({ input }) => input.account_ids.length > 0).then(() => {
      const { data } = useQueryGraphStep({
        entity: "payout_account",
        fields: ["id", "kyc_status", "disabled_reason"],
        filters: { id: input.account_ids },
      }).config({ name: "kyc-attention-accounts-query" })
      return data
    })

    const alerting = resolveAlertingStep()

    const attention = transform({ accounts }, ({ accounts }): KycAttention[] =>
      ((accounts ?? []) as { id: string; kyc_status: string | null; disabled_reason: string | null }[])
        .filter(needsKycAttention)
        .map((account) => ({
          account_id: account.id,
          kyc_status: account.kyc_status,
          disabled_reason: account.disabled_reason,
        }))
    )

    const notifications = transform({ attention, alerting }, ({ attention, alerting }) =>
      kycAttentionNotifications(attention, alerting)
    )

    const sent = sendOperatorEmailsStep(notifications)

    return new WorkflowResponse(
      transform({ attention, sent }, ({ attention, sent }) => ({
        attention: attention.length,
        sent,
      }))
    )
  }
)
