import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCollectionRequestUpdatedEvent } from '../modules/requests/types'
import { sendVendorUIRequestNotification } from '../modules/requests/utils/notifications'

export default async function sellerProductCollectionRequestAcceptedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
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
