import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules, PaymentEvents } from '@medusajs/framework/utils'

import { markSplitOrderPaymentsAsCapturedWorkflow } from '../workflows/split-order-payment/workflows'

/**
 * *
 * Subscriber for event: PaymentEvents.CAPTURED. "initiates post-capture workflow for split order payments on successful payment capture"
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete
 */
export default async function paymentCapturedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  const payment_id = event.data.id
  const paymentService = container.resolve(Modules.PAYMENT)

  const payment = await paymentService.retrievePayment(payment_id, {
    relations: ['payment_collection']
  })

  await markSplitOrderPaymentsAsCapturedWorkflow.run({
    container,
    input: payment.payment_collection_id
  })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: {
    subscriberId: 'split-payment-payment-captured-handler'
  }
}
