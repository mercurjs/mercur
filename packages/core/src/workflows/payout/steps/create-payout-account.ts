import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutAccountDTO, MercurModules, PayoutAccountDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const createPayoutAccountStep = createStep(
  "create-payout-account",
  async (input: CreatePayoutAccountDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const payoutAccount: PayoutAccountDTO = await service.createPayoutAccount(input)

    return new StepResponse(payoutAccount, payoutAccount.id)
  }
)
