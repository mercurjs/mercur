import { Resend } from 'resend'

import {
  AbstractNotificationProviderService,
  MedusaError
} from '@medusajs/framework/utils'
import { ProviderSendNotificationDTO } from '@medusajs/types'

import { ResendOptions } from './types/options'
import { emailTemplates } from './email-templates'

export enum ResendNotificationTemplates {
  BUYER_ACCOUNT_CREATED = 'buyerAccountCreatedEmailTemplate',
  BUYER_NEW_ORDER = 'buyerNewOrderEmailTemplate',
  BUYER_CANCELED_ORDER = 'buyerCancelOrderEmailTemplate',
  BUYER_ORDER_SHIPPED = 'buyerOrderShippedEmailTemplate',
  VENDOR_FORGOT_PASSWORD = 'vendor-forgot-password',
  VENDOR_ACCOUNT_UPDATES_SUBMISSION = 'vendorAccountSubmissionEmailTemplate',
  VENDOR_ACCOUNT_UPDATES_APPROVAL = 'vendorAccountApprovedEmailTemplate',
  VENDOR_ACCOUNT_UPDATES_REJECTION = 'vendorAccountRejectedEmailTemplate',
  VENDOR_NEW_ORDER = 'vendorNewOrderEmailTemplate',
  VENDOR_CANCELED_ORDER = 'vendorCanceledOrderEmailTemplate',
  VENDOR_ORDER_SHIPPED = 'vendorOrderShippingEmailTemplate',
  VENDOR_TEAM_MEMBER_INVITATION = 'vendorTeamInviteEmailTemplate',
  FORGOT_PASSWORD = 'forgotPasswordEmailTemplate'
}

export function validateModuleOptions(
  options: Record<any, any>,
  moduleName: string
) {
  for (const key in options) {
    if (!options[key]) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No ${key} was provided in the ${moduleName} options. Please add one.`
      )
    }
  }
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = 'resend-notification'
  private resendClient: Resend
  private options: ResendOptions

  constructor(container, options: ResendOptions) {
    super()
    validateModuleOptions(options, 'resendNotificationProvider')
    this.resendClient = new Resend(options.api_key)
    this.options = options
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
