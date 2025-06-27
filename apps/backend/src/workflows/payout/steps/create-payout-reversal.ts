import { BigNumberInput } from '@medusajs/framework/types'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { PayoutDTO } from '@mercurjs/framework'
import { PAYOUT_MODULE } from '@mercurjs/payout'
import { PayoutModuleService } from '@mercurjs/payout'

type CreatePayoutReversalStepInput = {
  payout_id: string | null
  amount: BigNumberInput
  currency_code: string
}

export const createPayoutReversalStep = createStep(
  'create-payout-reversal',
  async (input: CreatePayoutReversalStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE)

    if (input.payout_id === null) {
      return new StepResponse()
    }

    let payoutReversal: PayoutDTO | null = null
    let err = false

    try {
      //@ts-expect-error We check if payout_id is not null above
      payoutReversal = await service.createPayoutReversal(input)
    } catch {
      err = true
    }

    return new StepResponse({
      payoutReversal,
      err
    })
  }
)
