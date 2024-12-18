import { PAYOUT_MODULE } from '#/modules/payout'
import PayoutModuleService from '#/modules/payout/service'
import { CreatePayoutDTO, PayoutDTO } from '#/modules/payout/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutStep = createStep(
  'create-payout',
  async (input: CreatePayoutDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE)

    let payout: PayoutDTO | null = null
    let err = false

    try {
      payout = await service.createPayout(input)
    } catch (_error) {
      err = true
    }

    return new StepResponse({
      payout,
      err
    })
  }
)
