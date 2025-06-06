import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductTypeRequestUpdatedEvent } from '../modules/requests/types'
import { sendVendorUIRequestNotification } from '../modules/requests/utils/notifications'

export default async function sellerProductTypeRequestRejectedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_type',
    template: 'seller_product_type_request_rejected_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductTypeRequestUpdatedEvent.REJECTED,
  context: {
    subscriberId: 'seller-product-type-request-rejected-handler'
  }
}
