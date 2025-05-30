import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { ResendNotificationTemplates } from '../../../modules/resend/types/templates'
import { CreateSellerInvitationDTO } from '../../../modules/seller/types'

export const sendSellerInvitationEmailStep = createStep(
  'send-seller-invitation-email',
  async (input: CreateSellerInvitationDTO, { container }) => {
    const service = container.resolve(Modules.NOTIFICATION)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    try {
      const notification = await service.createNotifications({
        channel: 'email',
        to: input.email,
        template: ResendNotificationTemplates.NEW_SELLER_INVITATION,
        content: {
          subject: `You've been invited to join Mercur`
        },
        data: {
          data: {
            url: input.registration_url
          }
        }
      })

      return new StepResponse(notification)
    } catch (e) {
      logger.error(e)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'Notification provider failed!'
      )
    }
  }
)
