import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { AdjustmentType } from "../../../types/common"
import { createAdjustmentsStep, validateAdjustmentAccountStep } from "../steps"

export type CreateAdjustmentsWorkflowInput = {
  account_id?: string
  seller_id?: string
  type: AdjustmentType
  amount: number
  currency_code: string
  reason?: string | null
  created_by?: string | null
}

export const createAdjustmentsWorkflowId = "create-stripe-adjustments"

/**
 * Books an operator adjustment on a payout account, given directly or as the
 * seller's account. The next settlement run sends it.
 */
export const createAdjustmentsWorkflow = createWorkflow(
  createAdjustmentsWorkflowId,
  function (input: CreateAdjustmentsWorkflowInput) {
    const sellerLinks = when(
      "adjustment-for-seller",
      { input },
      ({ input }) => !input.account_id && !!input.seller_id
    ).then(() => {
      const { data } = useQueryGraphStep({
        entity: "seller_payout_account",
        fields: ["payout_account_id"],
        filters: { seller_id: input.seller_id },
      }).config({ name: "adjustment-seller-account-query" })
      return data
    })

    const accountId = transform(
      { input, sellerLinks },
      ({ input, sellerLinks }) => input.account_id ?? (sellerLinks?.[0]?.payout_account_id as string | undefined) ?? null
    )

    validateAdjustmentAccountStep(
      transform({ input, accountId }, ({ input, accountId }) => ({ account_id: accountId, seller_id: input.seller_id }))
    )

    const adjustments = createAdjustmentsStep(
      transform({ input, accountId }, ({ input, accountId }) => [
        {
          account_id: accountId as string,
          type: input.type,
          amount: input.amount,
          currency_code: input.currency_code.toLowerCase(),
          reason: input.reason ?? null,
          created_by: input.created_by ?? null,
        },
      ])
    )

    return new WorkflowResponse(adjustments)
  }
)
