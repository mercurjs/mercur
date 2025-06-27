import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

import { HumanizeTypes, RequestDTO, RequestUpdated } from '@mercurjs/framework'
import { ResendNotificationTemplates } from '@mercurjs/resend'

import {
  Hosts,
  buildHostAddress,
  fetchAdminEmails
} from '../shared/infra/http/utils'

export default async function requestCreatedAdminNotifyHandler({
  event,
  container
}: SubscriberArgs<RequestDTO>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const {
    data: { type, data }
  } = event

  await notificationService.createNotifications({
    to: '',
    channel: 'feed',
    template: 'admin-ui',
    content: {
      subject: `New Request Created`
    },
    data: {
      title: `New ${HumanizeTypes[type]}`,
      description: 'You have received a new request from a seller 🔔',
      redirect: '/admin/requests'
    }
  })

  if (type === 'seller') {
    const admins = await fetchAdminEmails(container)
    const notifications = admins.map((email) => ({
      to: email,
      channel: 'email',
      template: ResendNotificationTemplates.ADMIN_SELLER_REQUEST_CREATED,
      content: {
        subject: 'Seller requested to join the platform'
      },
      data: {
        data: {
          seller_name: (data as any).seller.name || '',
          request_address: buildHostAddress(
            Hosts.BACKEND,
            `/admin/requests/seller`
          ).toString()
        }
      }
    }))

    await notificationService.createNotifications(notifications)
  }
}

export const config: SubscriberConfig = {
  event: RequestUpdated.CREATED,
  context: {
    subscriberId: 'request-created-admin-notify-handler'
  }
}
