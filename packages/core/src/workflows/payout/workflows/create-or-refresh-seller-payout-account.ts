import { ReturnWorkflow, WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutProviderInput } from "@mercurjs/types"

import { createOnboardingStep } from "../steps"
import { createPayoutAccountWorkflow } from "./create-payout-account"

export type CreateOrRefreshSellerPayoutAccountWorkflowInput = PayoutProviderInput & {
  seller_id: string
}

export type CreateOrRefreshSellerPayoutAccountWorkflowOutput = {
  account_id: string | null
  onboarding_published: boolean
}

export const createOrRefreshSellerPayoutAccountWorkflowId = "create-or-refresh-seller-payout-account"

/**
 * Creates the seller's payout account when missing and publishes a fresh
 * onboarding link until the seller has finished onboarding.
 */
export const createOrRefreshSellerPayoutAccountWorkflow: ReturnWorkflow<
  CreateOrRefreshSellerPayoutAccountWorkflowInput,
  CreateOrRefreshSellerPayoutAccountWorkflowOutput,
  []
> = createWorkflow(createOrRefreshSellerPayoutAccountWorkflowId, function (input: CreateOrRefreshSellerPayoutAccountWorkflowInput) {
  const { data: seller } = useQueryGraphStep({
    entity: "seller",
    fields: ["id", "payout_account.id", "payout_account.details_submitted"],
    filters: { id: input.seller_id },
    options: { isList: false, throwIfKeyNotFound: true },
  }).config({ name: "create-or-refresh-payout-account-seller-query" })

  const created = when("create-missing-payout-account", { seller }, ({ seller }) => !seller.payout_account).then(
    () =>
      createPayoutAccountWorkflow.runAsStep({
        input: { seller_id: input.seller_id, data: input.data, context: input.context },
      })
  )

  const onboarding = transform({ seller, created }, ({ seller, created }) => ({
    account_id: (seller.payout_account?.id ?? created?.id ?? null) as string | null,
    refresh_link: !!seller.payout_account && !seller.payout_account.details_submitted,
    created: !!created,
  }))

  // A new account already got its link from createPayoutAccountWorkflow; an
  // existing one gets a fresh link because provider onboarding links expire.
  when("refresh-onboarding-link", { onboarding }, ({ onboarding }) => onboarding.refresh_link).then(() => {
    createOnboardingStep(
      transform({ onboarding }, ({ onboarding }) => ({ account_id: onboarding.account_id as string }))
    )
  })

  return new WorkflowResponse(
    transform({ onboarding }, ({ onboarding }) => ({
      account_id: onboarding.account_id,
      onboarding_published: onboarding.created || onboarding.refresh_link,
    }))
  )
})
