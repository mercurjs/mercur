import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

import { SellerTeamInviteEvent } from '@mercurjs/framework'
import { ResendNotificationTemplates } from '@mercurjs/resend'

import { buildInviteUrl } from '../shared/infra/http/utils'

export default async function sellerTeamInviteHandler({
  event,
  container
}: SubscriberArgs<{
  user_name: string
  store_name: string
  token: string
  id: string
  email: string
}>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const invite = event.data

  await notificationService.createNotifications({
    to: invite.email,
    channel: 'email',
    template: ResendNotificationTemplates.SELLER_TEAM_MEMBER_INVITATION,
    content: {
      subject: `You've been invited to join a team on Mercur`
    },
    data: {
      data: {
        user_name: invite.user_name,
        store_name: invite.store_name,
        host: buildInviteUrl(invite.token).toString(),
        id: invite.id,
        email: invite.email
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: SellerTeamInviteEvent.CREATED,
  context: {
    subscriberId: 'seller-team-invite-handler'
  }
}
