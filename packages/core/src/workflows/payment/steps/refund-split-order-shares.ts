import { MathBN } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { getOrderCapturedBalance, loadSplitOrderPaymentContext } from "../utils"
import { refundSplitOrderPaymentWorkflow } from "../workflows/refund-split-order-payment"

export type RefundSplitOrderSharesStepInput = {
  order_id: string
  created_by?: string
}

export const refundSplitOrderSharesStepId = "refund-split-order-shares"

/**
 * Refunds whatever an order still holds of the cart's shared payments, leaving
 * its sibling orders' shares untouched. Not compensated: the money has left.
 */
export const refundSplitOrderSharesStep = createStep(
  refundSplitOrderSharesStepId,
  async (input: RefundSplitOrderSharesStepInput, { container }) => {
    const context = await loadSplitOrderPaymentContext(container, {
      order_id: input.order_id,
    })
    const order = context.orders.find((o) => o.id === input.order_id)

    if (!context.is_split || !order) {
      return new StepResponse([] as string[])
    }

    const refundedPaymentIds: string[] = []

    for (const payment of context.payments) {
      const balance = getOrderCapturedBalance(order.transactions, payment)
      if (!MathBN.gt(balance, 0)) {
        continue
      }

      await refundSplitOrderPaymentWorkflow(container).run({
        input: {
          payment_id: payment.id,
          order_id: order.id,
          amount: balance.toNumber(),
          created_by: input.created_by,
        },
      })
      refundedPaymentIds.push(payment.id)
    }

    return new StepResponse(refundedPaymentIds)
  }
)
