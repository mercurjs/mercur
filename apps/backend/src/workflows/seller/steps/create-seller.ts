import SellerModuleService from 'src/modules/seller/service'
import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService } from '@medusajs/framework/types'

import { kebabCase } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { ResendNotificationTemplates } from '../../../modules/resend/service'
import { SELLER_MODULE } from '../../../modules/seller'
import {
  CreateSellerDTO,
  SellerDTO,
  SellerStatus
} from '../../../modules/seller/types'

export const createSellerStep = createStep(
  'create-seller',
  async (input: CreateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const seller: SellerDTO = await service.createSellers({
      ...input,
      status: SellerStatus.PENDING,
      handle: kebabCase(input.name)
    })

    const notificationModuleService: INotificationModuleService =
      container.resolve(Modules.NOTIFICATION)

    await notificationModuleService.createNotifications({
      to: seller.email,
      channel: 'email',
      template: ResendNotificationTemplates.BUYER_ACCOUNT_CREATED,
			content: {
				subject: 'Mercur - New Buyer Account!'
			},
      data: { data: { user_name: seller.name } }
    })

    return new StepResponse(seller, seller.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteSellers([id])
  }
)
