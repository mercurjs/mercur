import { BigNumberInput } from "@medusajs/framework/types"
import { BigNumber, createRawPropertiesFromBigNumber, MathBN } from "@medusajs/framework/utils"
import { PayoutBalanceDTO, PayoutBalanceTotals } from "@mercurjs/types"

export function calculatePayoutTransactions({ transactions, currentBalance }: {
  currentBalance?: PayoutBalanceDTO,
  transactions: {
    amount: BigNumberInput
    reference?: string
    reference_id?: string
  }[]
}
): PayoutBalanceTotals {
  const currentRawBalance = currentBalance?.totals?.raw_balance?.value ?? "0"
  let newBalance = MathBN.convert(currentRawBalance)

  for (const transaction of transactions) {
    newBalance = MathBN.add(newBalance, transaction.amount)
  }

  const totals = {
    balance: new BigNumber(newBalance),
  }

  createRawPropertiesFromBigNumber(totals)

  return totals as unknown as PayoutBalanceTotals
}
