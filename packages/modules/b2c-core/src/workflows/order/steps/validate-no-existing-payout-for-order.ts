import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import orderPayoutLink from '../../../links/order-payout'

export const validateNoExistingPayoutForOrderStep = createStep(
  'validate-no-existing-payout-for-order',
  async (id: string, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [orderRelation]
    } = await query.graph({
      entity: orderPayoutLink.entryPoint,
      fields: ['order_id'],
      filters: {
        order_id: id
      }
    })

    if (orderRelation) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Payout already exists for order: ${id}`
      )
    }
  }
)
