import { createRemoteLinkStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutDTO, MercurModules } from "@mercurjs/types"

import { createPayoutStep } from "../steps"

export const createPayoutWorkflowId = "create-payout"

export const createPayoutWorkflow = createWorkflow(
  createPayoutWorkflowId,
  function (input: CreatePayoutDTO) {
    const { data: payoutAccount } = useQueryGraphStep({
      entity: "payout_account",
      fields: ["id", "seller.id"],
      filters: { id: input.account_id },
      options: {
        isList: false,
      }
    })

    const payout = createPayoutStep({
      account_id: input.account_id,
      amount: input.amount,
      currency_code: input.currency_code,
      context: input.context,
      data: input.data,
    })

    createRemoteLinkStep([
      {
        [MercurModules.PAYOUT]: {
          payout_id: payout.id,
        },
        [MercurModules.SELLER]: {
          seller_id: payoutAccount.seller.id,
        },
      },
    ])

    return new WorkflowResponse(payout)
  }
)
