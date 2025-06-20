import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCategoryRequestUpdatedEvent } from '../modules/requests/types'
import { sendVendorUIRequestNotification } from '../modules/requests/utils/notifications'

export default async function sellerProductCategoryRequestAcceptedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_category',
    template: 'seller_product_category_request_accepted_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductCategoryRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: 'seller-product-category-request-accepted-handler'
  }
}
