import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError
} from '@medusajs/framework/utils'
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  addOrderTransactionStep,
  refundPaymentsStep
} from '@medusajs/medusa/core-flows'

import { RefundSplitOrderPaymentsDTO } from '@mercurjs/framework'

import orderSplitOrderPayment from '../../../links/order-split-order-payment'

export const selectAndValidatePaymentRefundStep = createStep(
  'select-and-validate-payment-refund-step',
  async function (input: RefundSplitOrderPaymentsDTO, { container }) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [splitPayment]
    } = await query.graph({
      entity: orderSplitOrderPayment.entryPoint,
      fields: ['*', 'split_order_payment.payment_collection_id'],
      filters: {
        split_order_payment_id: input.id
      }
    })

    const {
      data: [payment_collection]
    } = await query.graph({
      entity: 'payment_collection',
      fields: ['payments.id'],
      filters: {
        id: splitPayment.split_order_payment.payment_collection_id
      }
    })

    const payment_id = payment_collection.payments[0].id

    const {
      data: [payment]
    } = await query.graph({
      entity: 'payment',
      fields: [
        'id',
        'currency_code',
        'refunds.id',
        'refunds.amount',
        'captures.id',
        'captures.amount'
      ],
      filters: {
        id: payment_id
      }
    })

    const capturedAmount = (payment.captures || []).reduce(
      (acc, capture) => MathBN.sum(acc, capture.amount),
      MathBN.convert(0)
    )

    const refundedAmount = (payment.refunds || []).reduce(
      (acc, capture) => MathBN.sum(acc, capture.amount),
      MathBN.convert(0)
    )

    const refundableAmount = MathBN.sub(capturedAmount, refundedAmount)

    if (MathBN.gt(input.amount, refundableAmount)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Payment with id ${payment.id} is trying to refund amount greater than the refundable amount`
      )
    }

    return new StepResponse({
      payment_id: payment.id,
      currency_code: payment.currency_code,
      amount: input.amount,
      order_id: splitPayment.order_id
    })
  }
)

export const partialPaymentRefundWorkflow = createWorkflow(
  {
    name: 'partial-payment-refund'
  },
  function (input: RefundSplitOrderPaymentsDTO) {
    const paymentToRefund = selectAndValidatePaymentRefundStep(input)

    const refundedPayments = refundPaymentsStep(
      transform({ input, paymentToRefund }, ({ input, paymentToRefund }) => {
        return [
          {
            payment_id: paymentToRefund.payment_id,
            amount: input.amount
          }
        ]
      })
    )

    const orderTransaction = transform(
      { paymentToRefund },
      ({ paymentToRefund }) => ({
        order_id: paymentToRefund.order_id,
        amount: MathBN.mult(paymentToRefund.amount, -1),
        currency_code: paymentToRefund.currency_code,
        reference_id: paymentToRefund.payment_id,
        reference: 'refund'
      })
    )

    addOrderTransactionStep(orderTransaction)

    return new WorkflowResponse(refundedPayments)
  }
)
