import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

import { RequestDTO } from '../modules/requests/types'
import { SellerRequestUpdatedEvent } from '../modules/requests/types/events'
import { ResendNotificationTemplates } from '../modules/resend/types/templates'

export default async function sellerRequestRejectedHandler({
  event,
  container
}: SubscriberArgs<RequestDTO>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const requestData = event.data.data as {
    provider_identity_id: string
    member: { name: string }
  }

  await notificationService.createNotifications({
    to: requestData.provider_identity_id,
    channel: 'email',
    template: ResendNotificationTemplates.SELLER_ACCOUNT_UPDATES_REJECTION,
    content: {
      subject: 'Mercur - Seller account rejected!'
    }
  })
}

export const config: SubscriberConfig = {
  event: SellerRequestUpdatedEvent.REJECTED,
  context: {
    subscriberId: 'seller-request-rejected-handler'
  }
}
