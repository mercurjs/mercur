import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { ONBOARDING_CHECKPOINT, ONBOARDING_PAGE, onboardingSellerFilters } from "../utils/onboarding-sellers"

export type SelectOnboardingSellersWorkflowInput = {
  seller_ids?: string[]
}

export type SelectOnboardingSellersWorkflowOutput = {
  seller_ids: string[]
  checkpoint: string | null
}

export const selectOnboardingSellersWorkflowId = "select-stripe-onboarding-sellers"

/** The given sellers, or the next page of sellers touched since the onboarding checkpoint. */
export const selectOnboardingSellersWorkflow = createWorkflow(
  selectOnboardingSellersWorkflowId,
  function (input: SelectOnboardingSellersWorkflowInput) {
    const { data: checkpoints } = useQueryGraphStep({
      entity: "connector_checkpoint",
      fields: ["value"],
      filters: { key: ONBOARDING_CHECKPOINT },
    }).config({ name: "onboarding-checkpoint-query" })

    const { data: sellers } = useQueryGraphStep({
      entity: "seller",
      fields: ["id", "updated_at"],
      filters: transform({ input, checkpoints }, ({ input, checkpoints }) =>
        onboardingSellerFilters(input.seller_ids, (checkpoints[0]?.value as string | null | undefined) ?? null)
      ),
      pagination: { take: ONBOARDING_PAGE, order: { updated_at: "ASC" } },
    }).config({ name: "onboarding-sellers-query" })

    return new WorkflowResponse(
      transform({ input, sellers }, ({ input, sellers }): SelectOnboardingSellersWorkflowOutput => ({
        seller_ids: sellers.map((seller) => seller.id as string),
        checkpoint:
          !input.seller_ids && sellers.length
            ? new Date(sellers[sellers.length - 1].updated_at as Date | string).toISOString()
            : null,
      }))
    )
  }
)
