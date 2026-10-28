import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents } from "@mercurjs/types"

import { createOnboardingStep, updatePayoutAccountStep } from "../steps"

export type SyncPayoutAccountWorkflowInput = {
  id: string
}

export const syncPayoutAccountWorkflowId = "sync-payout-account"

/**
 * Pulls the account from the provider, swaps the onboarding link for a login
 * link once details are submitted, and emits `payout.account_updated`.
 */
export const syncPayoutAccountWorkflow = createWorkflow(
  syncPayoutAccountWorkflowId,
  function (input: SyncPayoutAccountWorkflowInput) {
    const account = updatePayoutAccountStep({ id: input.id })

    when("publish-login-link", { account }, ({ account }) => account.details_submitted).then(() => {
      createOnboardingStep({ account_id: input.id })
    })

    const { data: links } = useQueryGraphStep({
      entity: "seller_payout_account",
      fields: ["seller_id"],
      filters: { payout_account_id: input.id },
    }).config({ name: "synced-account-seller-query" })

    emitEventStep({
      eventName: PayoutModuleEvents.ACCOUNT_UPDATED,
      data: transform({ account, links }, ({ account, links }) => ({
        id: account.id,
        seller_id: links[0]?.seller_id ?? null,
        external_id: account.external_id,
        status: account.status,
        kyc_status: account.kyc_status,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        disabled_reason: account.disabled_reason,
      })),
    })

    return new WorkflowResponse(account)
  }
)
