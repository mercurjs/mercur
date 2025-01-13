import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'
import { INotificationModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import SellerModuleService from 'src/modules/seller/service'

import { ResendNotificationTemplates } from '../../../modules/resend/service'
import { SELLER_MODULE } from '../../../modules/seller'
import { ChangeSellerStatusDTO, SellerDTO } from '../../../modules/seller/types'

export const approveSellerStep = createStep(
  'approve-seller',
  async (input: ChangeSellerStatusDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const [previousData] = await service.listSellers({
      id: input.id
    })

    const updatedSellers: SellerDTO = await service.updateSellers({
      ...input
    })

    const notificationModuleService: INotificationModuleService =
					container.resolve(Modules.NOTIFICATION)

    await notificationModuleService.createNotifications({
					to: previousData.email,
					channel: 'email',
					template: ResendNotificationTemplates.VENDOR_ACCOUNT_UPDATES_APPROVAL,
					content: {
						subject: 'Mercur - Seller account approved!'
					},
					data: { data: { user_name: previousData.name } }
				})

    return new StepResponse(updatedSellers, previousData)
  },
  async (previousData: SellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateSellers(previousData)
  }
)
