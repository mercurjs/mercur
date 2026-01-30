import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutTransactionDTO, MercurModules } from "@mercurjs/types"

import PayoutService from "../../../modules/payout/services/payout-service"

type AddPayoutTransactionsInput = {
  account_id: string
  transactions: Omit<CreatePayoutTransactionDTO, 'account_id'>[]
}

export const addPayoutTransactionsStepId = "add-payout-transactions-step"

/**
 * This step creates payout transactions and updates the account balance.
 */
export const addPayoutTransactionsStep = createStep(
  addPayoutTransactionsStepId,
  async (input: AddPayoutTransactionsInput, { container }) => {
    const payoutService = container.resolve<PayoutService>(MercurModules.PAYOUT)

    if (!input.transactions.length) {
      return new StepResponse([], [])
    }

    const created = await payoutService.addPayoutTransactions(
      input.account_id,
      input.transactions
    )

    return new StepResponse(
      created,
      created.map((t) => t.id)
    )
  },
  async (transactionIds, { container }) => {
    if (!transactionIds?.length) {
      return
    }

    const payoutService = container.resolve<PayoutService>(MercurModules.PAYOUT)

    await payoutService.deletePayoutTransactions(transactionIds)
  }
)
