import { ReactNode } from 'react'
import { Resend } from 'resend'

import {
  AbstractNotificationProviderService,
  MedusaError
} from '@medusajs/framework/utils'
import { ProviderSendNotificationDTO } from '@medusajs/types'

import { BuyerAccountCreatedEmailTemplate } from './email-templates/buyer-account-created'
import { BuyerCancelOrderEmailTemplate } from './email-templates/buyer-cancel-order'
import { BuyerNewOrderEmailTemplate } from './email-templates/buyer-new-order'
import { BuyerOrderShippedEmailTemplate } from './email-templates/buyer-shipped-order'
import { ForgotPasswordEmailTemplate } from './email-templates/forgot-password'
import { VendorAccountApprovedEmailTemplate } from './email-templates/vendor-account-approved'
import { VendorAccountRejectedEmailTemplate } from './email-templates/vendor-account-rejected'
import { VendorAccountSubmissionEmailTemplate } from './email-templates/vendor-account-updates-submission'
import { VendorCanceledOrderEmailTemplate } from './email-templates/vendor-canceled-order'
import { VendorNewOrderEmailTemplate } from './email-templates/vendor-new-order'
import { VendorOrderShippingEmailTemplate } from './email-templates/vendor-shipping-order'
import { VendorTeamInviteEmailTemplate } from './email-templates/vendor-team-invite'
import { ResendOptions } from './types/options'

export enum ResendNotificationTemplates {
  BUYER_ACCOUNT_CREATED = 'buyer-account-created',
  FORGOT_PASSWORD = 'forgot-password',
  BUYER_NEW_ORDER = 'buyer-new_order',
  BUYER_CANCELED_ORDER = 'buyer-canceled-order',
  BUYER_ORDER_SHIPPED = 'buyer-order-shipped',
  VENDOR_FORGOT_PASSWORD = 'vendor-forgot-password',
  VENDOR_ACCOUNT_UPDATES_SUBMISSION = 'vendor-account-updates-submission',
  VENDOR_ACCOUNT_UPDATES_APPROVAL = 'vendor-account-updates-approval',
  VENDOR_ACCOUNT_UPDATES_REJECTION = 'vendor-account-updates-rejection',
  VENDOR_NEW_ORDER = 'vendor-new-order',
  VENDOR_CANCELED_ORDER = 'vendor-canceled-order',
  VENDOR_ORDER_SHIPPED = 'vendor-shipped-order',
  VENDOR_TEAM_MEMBER_INVITATION = 'vendor-team-member-invitation'
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

  private async sendMail(subject: string, body: ReactNode, toEmail: string) {
    const { data, error } = await this.resendClient.emails.send({
      from: this.options.from,
      to: toEmail,
      subject: subject,
      react: body
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

  private async sendBuyerAccountCreatedEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      BuyerAccountCreatedEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendBuyerCancelOrderEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      BuyerCancelOrderEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendBuyerNewOrderEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      BuyerNewOrderEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendBuyerShippedOrderEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      BuyerOrderShippedEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendForgotPasswordEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      ForgotPasswordEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendVendorAccountApprovedEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      VendorAccountApprovedEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendVendorAccountRejectedEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      VendorAccountRejectedEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendVendorAccountSubmissionEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      VendorAccountSubmissionEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendVendorCanceledOrderEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      VendorCanceledOrderEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendVendorNewOrderEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      VendorNewOrderEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendVendorOrderShippingEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      VendorOrderShippingEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  private async sendVendorTeamInviteEmail(
    notification: ProviderSendNotificationDTO
  ) {
    const orderData = { order: notification?.data }
    const dynamicSubject = notification?.data?.subject as string

    return await this.sendMail(
      dynamicSubject,
      VendorTeamInviteEmailTemplate({ data: orderData }),
      notification.to
    )
  }

  async send(notification: ProviderSendNotificationDTO) {
    switch (notification.template) {
      case ResendNotificationTemplates.BUYER_ACCOUNT_CREATED.toString():
        return await this.sendBuyerAccountCreatedEmail(notification)

      case ResendNotificationTemplates.BUYER_CANCELED_ORDER.toString():
        return await this.sendBuyerCancelOrderEmail(notification)

      case ResendNotificationTemplates.BUYER_NEW_ORDER.toString():
        return await this.sendBuyerNewOrderEmail(notification)

      case ResendNotificationTemplates.BUYER_ORDER_SHIPPED.toString():
        return await this.sendBuyerShippedOrderEmail(notification)

      case ResendNotificationTemplates.FORGOT_PASSWORD.toString():
        return await this.sendForgotPasswordEmail(notification)

      case ResendNotificationTemplates.VENDOR_ACCOUNT_UPDATES_APPROVAL.toString():
        return await this.sendVendorAccountApprovedEmail(notification)

      case ResendNotificationTemplates.VENDOR_ACCOUNT_UPDATES_REJECTION.toString():
        return await this.sendVendorAccountRejectedEmail(notification)

      case ResendNotificationTemplates.VENDOR_ACCOUNT_UPDATES_SUBMISSION.toString():
        return await this.sendVendorAccountSubmissionEmail(notification)

      case ResendNotificationTemplates.VENDOR_CANCELED_ORDER.toString():
        return await this.sendVendorCanceledOrderEmail(notification)

      case ResendNotificationTemplates.VENDOR_NEW_ORDER.toString():
        return await this.sendVendorNewOrderEmail(notification)

      case ResendNotificationTemplates.VENDOR_ORDER_SHIPPED.toString():
        return await this.sendVendorOrderShippingEmail(notification)

      case ResendNotificationTemplates.VENDOR_TEAM_MEMBER_INVITATION.toString():
        return await this.sendVendorTeamInviteEmail(notification)
    }

    return {}
  }
}

export default ResendNotificationProviderService
