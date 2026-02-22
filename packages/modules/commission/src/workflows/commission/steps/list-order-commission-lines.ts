import {
  BigNumber,
  ContainerRegistrationKeys,
  MathBN
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const listOrderCommissionLinesStep = createStep(
  'list-order-commission-lines',
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
      fields: ['items.id', 'currency_code'],
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

    const amount: BigNumber = commission_lines.reduce((acc, current) => {
      return MathBN.add(acc, current.value)
    }, MathBN.convert(0))

    return new StepResponse({
      commission_value: { amount, currency_code: order.currency_code },
      commission_lines
    })
  }
)
