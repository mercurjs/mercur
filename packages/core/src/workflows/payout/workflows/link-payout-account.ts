import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import { createPayoutAccountsStep, validateSellerWithoutPayoutAccountStep } from "../steps"
import { syncPayoutAccountWorkflow } from "./sync-payout-account"

export type LinkPayoutAccountWorkflowInput = {
  seller_id: string
  /** The account's id at the payout provider. */
  external_id: string
}

export const linkPayoutAccountWorkflowId = "link-payout-account"

/**
 * Attaches an account that already exists at the payout provider to a
 * seller, then pulls its state from the provider.
 */
export const linkPayoutAccountWorkflow = createWorkflow(
  linkPayoutAccountWorkflowId,
  function (input: LinkPayoutAccountWorkflowInput) {
    const { data: seller } = useQueryGraphStep({
      entity: "seller",
      fields: ["id", "payout_account.id"],
      filters: { id: input.seller_id },
      options: { isList: false, throwIfKeyNotFound: true },
    }).config({ name: "link-payout-account-seller-query" })

    validateSellerWithoutPayoutAccountStep({ seller })

    const accounts = createPayoutAccountsStep(
      transform({ input }, ({ input }) => [{ external_id: input.external_id, data: { id: input.external_id } }])
    )
    const account = transform({ accounts }, ({ accounts }) => accounts[0])

    createRemoteLinkStep([
      {
        [MercurModules.SELLER]: { seller_id: input.seller_id },
        [MercurModules.PAYOUT]: { payout_account_id: account.id },
      },
    ])

    const synced = syncPayoutAccountWorkflow.runAsStep({
      input: transform({ account }, ({ account }) => ({ id: account.id })),
    })

    return new WorkflowResponse(synced)
  }
)
