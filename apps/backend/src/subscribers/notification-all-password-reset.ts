import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { AuthWorkflowEvents, Modules } from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '@mercurjs/resend'

import {
  actorTypeToHost,
  buildResetPasswordUrl
} from '../shared/infra/http/utils/hosts'

export default async function passwordResetHandler({
  event,
  container
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)

  const hostType = actorTypeToHost[event.data.actor_type]
  if (!hostType) {
    return
  }

  await notificationService.createNotifications({
    to: event.data.entity_id,
    channel: 'email',
    template: ResendNotificationTemplates.FORGOT_PASSWORD,
    content: {
      subject: 'Mercur - Reset password request'
    },
    data: {
      data: {
        url: buildResetPasswordUrl(hostType, event.data.token).toString()
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: AuthWorkflowEvents.PASSWORD_RESET,
  context: {
    subscriberId: 'password-reset-handler'
  }
}
