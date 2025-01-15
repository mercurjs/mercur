import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { INotificationModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '../modules/resend/service'
import { SELLER_MODULE } from '../modules/seller'
import SellerModuleService from '../modules/seller/service'
import {
  REQUESTED_RESEND_VERIFY_EMAIL_EVENT,
  SELLER_CREATED_EVENT
} from '../shared/constants'
import { SellerCreatedEvent } from '../shared/events'

export default async function sellerCreatedHandler({
  event: { data },
  container
}: SubscriberArgs<SellerCreatedEvent>) {
	console.log("Even weszło")

  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION)

  const sellerModuleService: SellerModuleService =
    container.resolve(SELLER_MODULE)

  const seller = (
    await sellerModuleService.listSellers({
      email: data.email
    })
  )[0]

  await notificationModuleService.createNotifications({
    to: data.email,
    channel: 'email',
    template: ResendNotificationTemplates.VENDOR_VERIFY_EMAIL_TEMPLATE,
		content: {
			subject: 'Mercur - Account email verification'
		},
    data: { data: { user_name: seller.name, link: data.link } }
  })
}

export const config: SubscriberConfig = {
  event: [SELLER_CREATED_EVENT, REQUESTED_RESEND_VERIFY_EMAIL_EVENT]
}
