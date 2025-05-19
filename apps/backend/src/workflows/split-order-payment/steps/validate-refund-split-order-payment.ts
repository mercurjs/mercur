import { MathBN, MedusaError } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SPLIT_ORDER_PAYMENT_MODULE } from '../../../modules/split-order-payment'
import SplitOrderPaymentModuleService from '../../../modules/split-order-payment/service'
import { RefundSplitOrderPaymentsDTO } from '../../../modules/split-order-payment/types'

export const validateRefundSplitOrderPaymentStep = createStep(
  'validate-refund-split-order-payments',
  async (input: RefundSplitOrderPaymentsDTO, { container }) => {
    const service = container.resolve<SplitOrderPaymentModuleService>(
      SPLIT_ORDER_PAYMENT_MODULE
    )

    const payment = await service.retrieveSplitOrderPayment(input.id)

    const amountLeft = MathBN.convert(payment.captured_amount)
      .minus(payment.refunded_amount)
      .minus(input.amount)
      .toNumber()

    const refundedAmount = MathBN.convert(input.amount)
      .plus(payment.refunded_amount)
      .toNumber()

    const status = MathBN.gt(amountLeft, 0) ? 'partially_refunded' : 'refunded'

    if (input.amount <= 0 || MathBN.lt(amountLeft, 0)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'Invalid refund amount!'
      )
    }

    return new StepResponse({
      id: input.id,
      refunded_amount: refundedAmount,
      status
    })
  }
)
