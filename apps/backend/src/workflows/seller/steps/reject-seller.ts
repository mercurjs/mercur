import SellerModuleService from 'src/modules/seller/service'
import { INotificationModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { ResendNotificationTemplates } from '../../../modules/resend/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { ChangeSellerStatusDTO, SellerDTO } from '../../../modules/seller/types'

export const rejectSellerStep = createStep(
  'reject-seller',
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

		console.log('sendig rejection email')

    await notificationModuleService.createNotifications({
      to: previousData.email,
      channel: 'email',
      template: ResendNotificationTemplates.VENDOR_ACCOUNT_UPDATES_REJECTION,
      content: {
        subject: 'Mercur - Seller account rejection'
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
