import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutAccountDTO, MercurModules, PayoutAccountDTO } from "@mercurjs/types"

import PayoutService from "../../../modules/payout/services/payout-service"

export const createPayoutAccountStep = createStep(
  "create-payout-account",
  async (input: CreatePayoutAccountDTO, { container }) => {
    const service = container.resolve<PayoutService>(MercurModules.PAYOUT)

    const payoutAccount: PayoutAccountDTO = await service.createPayoutAccount(input)

    return new StepResponse(payoutAccount, payoutAccount.id)
  }
)
