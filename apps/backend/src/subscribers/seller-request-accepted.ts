import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

import {
  RequestDTO,
  SellerRequestUpdatedEvent
} from '../modules/requests/types'
import { ResendNotificationTemplates } from '../modules/resend/types/templates'

export default async function sellerRequestAcceptedHandler({
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
    template: ResendNotificationTemplates.SELLER_ACCOUNT_UPDATES_APPROVAL,
    content: {
      subject: 'Mercur - Seller account approved!'
    },
    data: { data: { user_name: requestData.member.name } }
  })
}

export const config: SubscriberConfig = {
  event: SellerRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: 'seller-request-accepted-handler'
  }
}
