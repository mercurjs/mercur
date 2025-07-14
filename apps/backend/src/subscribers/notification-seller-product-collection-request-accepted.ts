import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCollectionRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

/**
 * *
 * Subscriber for event: ProductCollectionRequestUpdatedEvent.ACCEPTED. Activates vendor UI notifications upon product collection request approval.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function sellerProductCollectionRequestAcceptedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_collection',
    template: 'seller_product_collection_request_accepted_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductCollectionRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: 'seller-product-collection-request-accepted-handler'
  }
}
