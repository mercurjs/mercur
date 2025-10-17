import { Resend } from 'resend'

import {
  AbstractNotificationProviderService,
  MedusaError
} from '@medusajs/framework/utils'
import { ProviderSendNotificationDTO } from '@medusajs/types'

import { emailTemplates } from './email-templates'

type ResendOptions = {
  api_key: string
  from: string
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = 'notification-resend'
  private resendClient: Resend
  private options: ResendOptions

  constructor(_, options: ResendOptions) {
    super()
    this.validateModuleOptions(options)
    this.resendClient = new Resend(options.api_key)
    this.options = options
  }

  validateModuleOptions(options: ResendOptions) {
    for (const key in options) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `No ${key} was provided in the ${ResendNotificationProviderService.identifier} options. Please add one.`
        )
      }
    }
  }

  async send(notification: ProviderSendNotificationDTO) {
    const { data, error } = await this.resendClient.emails.send({
      from: notification.from?.trim() || this.options.from,
      to: notification.to,
      subject: notification.content?.subject as string,
      react: emailTemplates[notification.template](notification.data)
    })

    if (error) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message)
    }

    if (!data) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'No data returned by resend client'
      )
    }

    return data
  }
}

export default ResendNotificationProviderService
