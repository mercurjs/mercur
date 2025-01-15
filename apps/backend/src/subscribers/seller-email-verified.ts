import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { INotificationModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { ResendNotificationTemplates } from '../modules/resend/service'

import { SELLER_MODULE } from '../modules/seller'
import SellerModuleService from '../modules/seller/service'
import { SELLER_EMAIL_VERIFIED } from '../shared/constants'
import { SellerEmailVerifiedEvent } from '../shared/events'

export default async function sellerEmailVerifiedHandler({
  event: { data },
  container
}: SubscriberArgs<SellerEmailVerifiedEvent>) {
  const sellerModuleService: SellerModuleService =
    container.resolve(SELLER_MODULE)

  const seller = (
    await sellerModuleService.listSellers({
      email: data.email
    })
  )[0]

	const notificationModuleService: INotificationModuleService =
	container.resolve(Modules.NOTIFICATION)

	await notificationModuleService.createNotifications({
		to: seller.email,
		channel: 'email',
		template: ResendNotificationTemplates.VENDOR_ACCOUNT_UPDATES_SUBMISSION,
		content: {
			subject: 'Mercur - Vendor account submission'
		},
		data: { data: { user_name: seller.name } }
	})
}

export const config: SubscriberConfig = {
  event: [SELLER_EMAIL_VERIFIED]
}
