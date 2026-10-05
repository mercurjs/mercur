import { BigNumberInput } from "@medusajs/framework/types"
import {
  getEpsilonFromDecimalPrecision,
  MathBN,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  getCurrencyDecimalDigits,
  getOrderCapturedBalance,
  isSplitOrderCanceled,
  loadSplitOrderPaymentContext,
} from "../utils"

export type PrepareSplitOrderRefundStepInput = {
  payment_id: string
  order_id?: string
  amount?: BigNumberInput
}

export const prepareSplitOrderRefundStepId = "prepare-split-order-refund"

/**
 * Resolves which order a refund belongs to and how much may be refunded. On a
 * payment shared by several split orders the refund is attributed to one order
 * and capped at what that order still holds of the payment.
 */
export const prepareSplitOrderRefundStep = createStep(
  prepareSplitOrderRefundStepId,
  async (input: PrepareSplitOrderRefundStepInput, { container }) => {
    const context = await loadSplitOrderPaymentContext(container, {
      payment_id: input.payment_id,
    })
    const payment = context.payments.find((p) => p.id === input.payment_id)!

    if (!context.orders.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No order found for payment with id: ${input.payment_id}`
      )
    }

    if (!input.order_id && context.orders.length > 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "order_id is required to refund a payment shared by several orders"
      )
    }

    const order = input.order_id
      ? context.orders.find((o) => o.id === input.order_id)
      : context.orders[0]

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order ${input.order_id} is not paid by payment ${input.payment_id}`
      )
    }

    let amount = input.amount

    if (context.is_split) {
      const balance = getOrderCapturedBalance(order.transactions, payment)
      const epsilon = getEpsilonFromDecimalPrecision(
        getCurrencyDecimalDigits(payment.currency_code)
      )

      if (amount == null) {
        amount = balance.toNumber()
      }

      if (!MathBN.gt(amount, 0)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Order ${order.id} has no captured amount left to refund`
        )
      }

      if (MathBN.gt(MathBN.sub(amount, balance), epsilon)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `You are not allowed to refund more than the amount captured for order ${order.id}`
        )
      }
    }

    return new StepResponse({
      order_id: order.id,
      order_currency_code: order.currency_code,
      order_is_canceled: isSplitOrderCanceled(order),
      pending_difference:
        order.summary?.raw_pending_difference ??
        order.summary?.pending_difference ??
        0,
      amount,
      payment,
    })
  }
)
