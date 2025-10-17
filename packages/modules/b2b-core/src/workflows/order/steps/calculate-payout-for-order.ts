import { ContainerRegistrationKeys, MathBN } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SplitOrderPaymentDTO } from '@mercurjs/framework'

export const calculatePayoutForOrderStep = createStep(
  'calculate-payout-for-order',
  async (
    input: {
      order_id: string
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order]
    } = await query.graph({
      entity: 'order',
      fields: ['items.id', 'split_order_payment.*'],
      filters: {
        id: input.order_id
      }
    })

    const order_line_items = order.items.map((i) => i.id)

    const { data: commission_lines } = await query.graph({
      entity: 'commission_line',
      fields: ['*'],
      filters: {
        item_line_id: order_line_items
      }
    })

    const total_commission = commission_lines.reduce((acc, current) => {
      return MathBN.add(acc, current.value)
    }, MathBN.convert(0))

    const orderPayment: SplitOrderPaymentDTO = order.split_order_payment

    const captured_amount = MathBN.convert(orderPayment.captured_amount)
    const refunded_amount = MathBN.convert(orderPayment.refunded_amount)

    const payout_total = captured_amount
      .minus(refunded_amount)
      .minus(total_commission)

    return new StepResponse(payout_total)
  }
)
