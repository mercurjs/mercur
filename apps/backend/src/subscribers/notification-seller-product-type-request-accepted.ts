import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductTypeRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

/**
 * *
 * Subscriber for event: ProductTypeRequestUpdatedEvent.ACCEPTED. Notifies vendors when their product type request is approved.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function sellerProductTypeRequestAcceptedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_type',
    template: 'seller_product_type_request_accepted_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductTypeRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: 'seller-product-type-request-accepted-handler'
  }
}
