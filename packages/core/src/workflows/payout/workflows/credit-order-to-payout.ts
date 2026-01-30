import { getOrderDetailWorkflow, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { MathBN, MedusaError } from "@medusajs/framework/utils"

import { addPayoutTransactionsStep } from "../steps"

export type CreditOrderToPayoutWorkflowInput = {
  order_id: string
}

export const creditOrderToPayoutWorkflowId = "credit-order-to-payout"

/**
 * This workflow credits the seller's payout account balance with the order earnings.
 * It calculates the net amount by subtracting commissions from the order total.
 */
export const creditOrderToPayoutWorkflow = createWorkflow(
  creditOrderToPayoutWorkflowId,
  function (input: WorkflowData<CreditOrderToPayoutWorkflowInput>) {
    const order = getOrderDetailWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        fields: ['id', 'seller.*', 'seller.payout_account.*', 'items.*', 'items.commission_lines.*'],
      }
    })

    const transactionInput = transform({ order }, ({ order }) => {
      const payoutAccountId = (order as any).seller?.payout_account?.id

      if (!payoutAccountId) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Seller does not have a payout account`
        )
      }

      const totalCommission = (order.items ?? []).reduce(
        (acc: number, item: any) => {
          const commissionAmount = item.commission_line?.amount ?? 0
          return MathBN.add(acc, commissionAmount) as unknown as number
        },
        0
      )

      const amount = MathBN.sub(order.total, totalCommission)

      return {
        account_id: payoutAccountId,
        transactions: [
          {
            amount: amount,
            currency_code: order.currency_code,
            reference: "order",
            reference_id: order.id,
          },
        ],
      }
    })

    const transactions = addPayoutTransactionsStep(transactionInput)

    return new WorkflowResponse(transactions)
  }
)
