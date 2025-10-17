import { SubscriberConfig } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { SubscriberArgs } from '@medusajs/medusa'
import { capturePaymentWorkflow } from '@medusajs/medusa/core-flows'

import { OrderSetWorkflowEvents } from '@mercurjs/framework'

import { markSplitOrderPaymentsAsCapturedWorkflow } from '../workflows/split-order-payment/workflows'

export default async function orderSetPlacedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { id: orderSetId } = event.data

  const {
    data: [order_set]
  } = await query.graph({
    entity: 'order_set',
    fields: ['payment_collection_id'],
    filters: {
      id: orderSetId
    }
  })

  const {
    data: [payment_collection]
  } = await query.graph({
    entity: 'payment_collection',
    fields: ['status', 'payments.*'],
    filters: {
      id: order_set.payment_collection_id
    }
  })

  if (!payment_collection || !payment_collection.payments[0]) {
    return
  }

  const { result } = await capturePaymentWorkflow.run({
    container,
    input: {
      payment_id: payment_collection.payments[0].id
    }
  })

  if (!result.captured_at) {
    throw new MedusaError(
      MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
      'Payment failed!'
    )
  }

  await markSplitOrderPaymentsAsCapturedWorkflow.run({
    container,
    input: order_set.payment_collection_id
  })
}

export const config: SubscriberConfig = {
  event: OrderSetWorkflowEvents.PLACED,
  context: {
    subscriberId: 'order-set-placed-payment-capture'
  }
}
