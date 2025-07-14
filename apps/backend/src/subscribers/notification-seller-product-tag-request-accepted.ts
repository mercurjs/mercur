import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductTagRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

/**
 * *
 * Subscriber for event: ProductTagRequestUpdatedEvent.ACCEPTED. Activates seller notifications when a product tag request is approved.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function sellerProductTagRequestAcceptedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_tag',
    template: 'seller_product_tag_request_accepted_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductTagRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: 'seller-product-tag-request-accepted-handler'
  }
}
