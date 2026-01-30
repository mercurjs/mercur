import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutTransactionDTO } from "@mercurjs/types"

import { addPayoutTransactionsStep } from "../steps"

type AddPayoutTransactionsInput = {
  account_id: string
  transactions: Omit<CreatePayoutTransactionDTO, 'account_id'>[]
}

export const addPayoutTransactionsWorkflowId = "add-payout-transactions"

export const addPayoutTransactionsWorkflow = createWorkflow(
  addPayoutTransactionsWorkflowId,
  function (input: AddPayoutTransactionsInput) {
    const transactions = addPayoutTransactionsStep({
      account_id: input.account_id,
      transactions: input.transactions,
    })

    return new WorkflowResponse(transactions)
  }
)
