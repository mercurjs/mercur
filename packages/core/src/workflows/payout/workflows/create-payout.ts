import { createRemoteLinkStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { MathBN } from "@medusajs/framework/utils"
import { CreatePayoutDTO, MercurModules } from "@mercurjs/types"

import { addPayoutTransactionsStep, createPayoutStep } from "../steps"

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

    const transactionInput = transform({ input, payout }, ({ input, payout }) => ({
      account_id: input.account_id,
      transactions: [
        {
          amount: MathBN.mult(input.amount, -1),
          currency_code: input.currency_code,
          reference: "payout",
          reference_id: payout.id,
        },
      ],
    }))

    addPayoutTransactionsStep(transactionInput)

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
