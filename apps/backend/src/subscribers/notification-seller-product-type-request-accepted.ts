import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductTypeRequestUpdatedEvent } from '../modules/requests/types'
import { sendVendorUIRequestNotification } from '../modules/requests/utils/notifications'

export default async function sellerProductTypeRequestAcceptedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
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
