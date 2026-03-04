import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils'
import { completeCartWorkflow } from '@medusajs/medusa/core-flows'

completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderSets } = await query.graph({
    entity: 'order_set',
    fields: ['id'],
    filters: {
      cart_id: cart.id
    }
  })

  if (orderSets && orderSets.length > 0) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `Cart ${cart.id} has already been processed by Mercur.`
    )
  }
})

