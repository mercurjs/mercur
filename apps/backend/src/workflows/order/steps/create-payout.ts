import { PAYOUT_MODULE } from '#/modules/payout'
import PayoutModuleService from '#/modules/payout/service'
import { CreatePayoutDTO, PayoutDTO } from '#/modules/payout/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutStep = createStep(
  'create-payout',
  async (input: CreatePayoutDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE)

    const payout: PayoutDTO = await service.processPayout(input)

    return new StepResponse(payout)
  }
)
