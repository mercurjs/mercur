import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"

import { createOnboardingStep } from "../steps"

export type RefreshPayoutAccountLinkWorkflowInput = {
  id: string
}

export const refreshPayoutAccountLinkWorkflowId = "refresh-payout-account-link"

/**
 * Publishes a new link for the seller: onboarding until their details are
 * submitted, the provider dashboard login afterwards.
 */
export const refreshPayoutAccountLinkWorkflow = createWorkflow(
  refreshPayoutAccountLinkWorkflowId,
  function (input: RefreshPayoutAccountLinkWorkflowInput) {
    const onboarding = createOnboardingStep({ account_id: input.id })

    return new WorkflowResponse(onboarding)
  }
)
