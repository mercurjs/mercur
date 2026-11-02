import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { createOnboardingStep, validateOnboardingTokenStep } from "../steps"

export type RefreshOnboardingWorkflowInput = {
  token: string
}

export type RefreshOnboardingWorkflowOutput = {
  url: string
}

export const refreshOnboardingWorkflowId = "refresh-onboarding"

/**
 * Exchanges an expired onboarding link's token for a fresh link. The token
 * is rotated, so each refresh URL works once and only within the module's
 * `onboarding.tokenTtlSeconds`.
 */
export const refreshOnboardingWorkflow = createWorkflow(
  refreshOnboardingWorkflowId,
  function (input: RefreshOnboardingWorkflowInput) {
    const { data: accounts } = useQueryGraphStep({
      entity: "payout_account",
      fields: ["id", "onboarding_token_issued_at"],
      filters: { onboarding_token: input.token },
    }).config({ name: "onboarding-token-account-query" })

    const account = transform({ accounts }, ({ accounts }) => accounts[0] ?? null)

    validateOnboardingTokenStep({ account })

    const onboarding = createOnboardingStep(
      transform({ account }, ({ account }) => ({ account_id: (account as { id: string }).id, rotate_token: true }))
    )

    return new WorkflowResponse(
      transform({ onboarding }, ({ onboarding }): RefreshOnboardingWorkflowOutput => ({
        url: onboarding.data?.url as string,
      }))
    )
  }
)
