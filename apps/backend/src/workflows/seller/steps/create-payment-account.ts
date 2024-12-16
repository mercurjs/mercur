import { PAYOUT_MODULE } from '#/modules/payout'
import PayoutModuleService from '#/modules/payout/service'
import { CreatePayoutAccountDTO } from '#/modules/payout/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutAccountStep = createStep(
  'create-payout-account',
  async (input: CreatePayoutAccountDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE)

    const payoutAccount = await service.createPayoutAccount(input)

    return new StepResponse(payoutAccount, payoutAccount.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE)

    await service.deletePayoutAccounts(id)
  }
)
