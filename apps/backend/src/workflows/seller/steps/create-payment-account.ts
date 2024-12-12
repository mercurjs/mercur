import { PAYOUTS_MODULE } from '#/modules/payouts'
import PayoutsModuleService from '#/modules/payouts/service'
import { CreatePaymentAccountDTO } from '#/modules/payouts/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPaymentAccountStep = createStep(
  'create-payment-account',
  async (input: CreatePaymentAccountDTO, { container }) => {
    const service = container.resolve<PayoutsModuleService>(PAYOUTS_MODULE)

    const paymentAccount = await service.createPaymentAccounts(input)

    return new StepResponse(paymentAccount, paymentAccount.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<PayoutsModuleService>(PAYOUTS_MODULE)

    await service.deletePaymentAccounts(id)
  }
)
