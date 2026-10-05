import { BigNumberInput, PaymentDTO } from "@medusajs/framework/types"
import { MathBN, PaymentEvents } from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  ReturnWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addOrderTransactionStep,
  createOrderCreditLinesWorkflow,
  emitEventStep,
  refundPaymentStep,
  useQueryGraphStep,
  validateRefundPaymentExceedsCapturedAmountStep,
} from "@medusajs/medusa/core-flows"

import { prepareSplitOrderRefundStep } from "../steps/prepare-split-order-refund"
import { RefundPaymentWorkflowHooks } from "./payment-hooks"

export type RefundSplitOrderPaymentWorkflowInput = {
  payment_id: string
  /**
   * The order the refund is attributed to. Required when the payment is shared
   * by several split orders.
   */
  order_id?: string
  created_by?: string
  amount?: BigNumberInput
  note?: string
  refund_reason_id?: string
}

export const refundSplitOrderPaymentWorkflowId = "refund-split-order-payment"

/**
 * Refunds a payment and records the refund on one order.
 *
 * Medusa's `refundPaymentWorkflow` throws for split orders because it requires
 * the order↔payment_collection link, while their shared payment collection
 * stays on the cart. This workflow resolves the order through the cart instead
 * and never refunds more than that order's share of the payment.
 */
export const refundSplitOrderPaymentWorkflow: ReturnWorkflow<
  RefundSplitOrderPaymentWorkflowInput,
  PaymentDTO,
  RefundPaymentWorkflowHooks
> = createWorkflow(
  refundSplitOrderPaymentWorkflowId,
  (input: RefundSplitOrderPaymentWorkflowInput) => {
    const refund = prepareSplitOrderRefundStep({
      payment_id: input.payment_id,
      order_id: input.order_id,
      amount: input.amount,
    })

    when("validate-refund-amount", { refund }, ({ refund }) => {
      return refund.amount != null
    }).then(() => {
      validateRefundPaymentExceedsCapturedAmountStep({
        payment: refund.payment as unknown as PaymentDTO,
        refundAmount: refund.amount as BigNumberInput,
      })
    })

    const refundReasonQuery = when(
      "fetch-refund-reason",
      { input },
      ({ input }) => !!input.refund_reason_id
    ).then(() => {
      return useQueryGraphStep({
        entity: "refund_reason",
        fields: ["id", "label", "code"],
        filters: { id: input.refund_reason_id },
        options: { throwIfKeyNotFound: true },
      }).config({ name: "refund-reason" })
    })

    const refundReason = transform(
      { refundReasonQuery },
      ({ refundReasonQuery }) =>
        (refundReasonQuery?.data?.[0] ?? null) as {
          id: string
          label: string
          code: string | null
        } | null
    )

    const refundInput = transform({ input, refund }, ({ input, refund }) => ({
      payment_id: input.payment_id,
      created_by: input.created_by,
      amount: refund.amount,
      note: input.note,
      refund_reason_id: input.refund_reason_id,
    }))

    const refundedPayment = refundPaymentStep(refundInput)

    const orderTransactions = transform(
      { refund, refundedPayment },
      ({ refund, refundedPayment }) => {
        const known = new Set(refund.payment.refunds.map((r) => r.id))

        return (refundedPayment.refunds ?? [])
          .filter((r) => !known.has(r.id))
          .map((r) => ({
            order_id: refund.order_id,
            amount: MathBN.mult(r.raw_amount ?? r.amount, -1),
            currency_code:
              refundedPayment.currency_code ?? refund.order_currency_code,
            reference: "refund",
            reference_id: r.id,
          }))
      }
    )

    addOrderTransactionStep(orderTransactions)

    const creditLineAmount = transform(
      { refund, refundedPayment },
      ({ refund, refundedPayment }) => {
        // Medusa refuses credit lines on a canceled order, and a canceled
        // order's total no longer needs correcting.
        if (refund.order_is_canceled) {
          return 0
        }

        const amountToRefund =
          refund.amount ?? refundedPayment.raw_amount ?? refundedPayment.amount

        if (MathBN.lt(refund.pending_difference, 0)) {
          const amountOwed = MathBN.mult(refund.pending_difference, -1)
          return MathBN.gt(amountToRefund, amountOwed)
            ? MathBN.sub(amountToRefund, amountOwed)
            : 0
        }

        return amountToRefund
      }
    )

    when("create-refund-credit-lines", { creditLineAmount }, ({ creditLineAmount }) =>
      MathBN.gt(creditLineAmount, 0)
    ).then(() => {
      const creditLinesInput = transform(
        { refund, creditLineAmount, refundReason },
        ({ refund, creditLineAmount, refundReason }) => ({
          id: refund.order_id,
          credit_lines: [
            {
              amount: creditLineAmount,
              reference: refundReason?.label ?? "payment_collection",
              reference_id:
                refundReason?.code ?? refund.payment.payment_collection_id,
            },
          ],
        })
      )

      // Runs after the refund transaction: it is that transaction that opens
      // the pending difference this credit line settles.
      createOrderCreditLinesWorkflow.runAsStep({
        input: creditLinesInput,
      })
    })

    emitEventStep({
      eventName: PaymentEvents.REFUNDED,
      data: { id: input.payment_id },
    })

    const paymentRefunded = createHook("paymentRefunded", {
      payment: refundedPayment,
      order_id: refund.order_id,
      amount: transform({ refund }, ({ refund }) => refund.amount ?? null),
      credit_line_amount: creditLineAmount,
      refund_reason: refundReason,
    })

    return new WorkflowResponse(refundedPayment, {
      hooks: [paymentRefunded],
    })
  }
)
