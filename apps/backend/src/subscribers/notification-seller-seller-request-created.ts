import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

import { RequestDTO, SellerRequest } from '@mercurjs/framework'
import { ResendNotificationTemplates } from '@mercurjs/resend'

export default async function requestCreatedSellerAccountUpdatesNotifyHandler({
  event,
  container
}: SubscriberArgs<RequestDTO>) {
  const requestData = event.data.data as {
    provider_identity_id: string
    member: { name: string }
  }

  if (event.data.type !== 'seller') {
    return
  }

  const notificationService = container.resolve(Modules.NOTIFICATION)

  await notificationService.createNotifications({
    to: requestData.provider_identity_id,
    channel: 'email',
    template: ResendNotificationTemplates.SELLER_ACCOUNT_UPDATES_SUBMISSION,
    content: {
      subject: 'Your submission has been received'
    },
    data: {
      data: {
        user_name: requestData.member.name
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: SellerRequest.CREATED,
  context: {
    subscriberId: 'request-created-seller-account-updates-notify-handler'
  }
}
