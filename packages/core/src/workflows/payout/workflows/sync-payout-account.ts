import { WorkflowResponse, createWorkflow, when } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents } from "@mercurjs/types"

import { createOnboardingStep, syncPayoutAccountStep } from "../steps"

export type SyncPayoutAccountWorkflowInput = {
  id: string
}

export const syncPayoutAccountWorkflowId = "sync-payout-account"

/**
 * Pulls the account from the provider, swaps the onboarding link for a login
 * link once details are submitted, and emits `payout_account.updated`.
 */
export const syncPayoutAccountWorkflow = createWorkflow(
  syncPayoutAccountWorkflowId,
  function (input: SyncPayoutAccountWorkflowInput) {
    const account = syncPayoutAccountStep({ id: input.id })

    when("publish-login-link", { account }, ({ account }) => account.details_submitted).then(() => {
      createOnboardingStep({ account_id: input.id })
    })

    emitEventStep({
      eventName: PayoutModuleEvents.ACCOUNT_UPDATED,
      data: { id: input.id },
    })

    return new WorkflowResponse(account)
  }
)
