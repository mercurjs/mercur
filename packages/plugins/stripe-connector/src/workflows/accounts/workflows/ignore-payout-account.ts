import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { PAYOUT_IGNORED_KEY } from "../../../types/common"
import { validateAccountSellerStep } from "../steps"

export type IgnorePayoutAccountWorkflowInput = {
  id: string
  ignored: boolean
}

type AccountSeller = { seller?: { id: string; metadata?: Record<string, unknown> | null } | null }

export const ignorePayoutAccountWorkflowId = "ignore-stripe-payout-account"

/**
 * Flags the account's seller so the transfers job leaves their orders alone,
 * or lifts the flag. The account itself is untouched.
 */
export const ignorePayoutAccountWorkflow = createWorkflow(
  ignorePayoutAccountWorkflowId,
  function (input: IgnorePayoutAccountWorkflowInput) {
    const { data: account } = useQueryGraphStep({
      entity: "payout_account",
      fields: ["id", "seller.id", "seller.metadata"],
      filters: { id: input.id },
      options: { isList: false, throwIfKeyNotFound: true },
    }).config({ name: "ignore-account-query" })

    const seller = transform({ account }, ({ account }) => (account as AccountSeller).seller ?? null)

    validateAccountSellerStep(
      transform({ input, seller }, ({ input, seller }) => ({ id: input.id, seller_id: seller?.id ?? null }))
    )

    updateSellersWorkflow.runAsStep({
      input: transform({ input, seller }, ({ input, seller }) => ({
        selector: { id: seller?.id },
        update: {
          metadata: { ...(seller?.metadata ?? {}), [PAYOUT_IGNORED_KEY]: String(input.ignored) },
        },
      })),
    })

    return new WorkflowResponse(void 0)
  }
)
