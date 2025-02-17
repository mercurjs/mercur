import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { AuthWorkflowEvents, Modules } from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '../modules/resend/types/templates'

export default async function passwordResetHandler({
  event,
  container
}: SubscriberArgs<{ entity_id: string; actorType: string; token: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)

  await notificationService.createNotifications({
    to: event.data.entity_id,
    channel: 'email',
    template: ResendNotificationTemplates.FORGOT_PASSWORD,
    content: {
      subject: 'Mercur - Reset password request'
    },
    data: {
      data: {
        host: 'http://localhost:7001',
        resetPasswordToken: event.data.token
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
