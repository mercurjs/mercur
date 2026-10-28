import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutAccountDTO, IPayoutModuleService, MercurModules } from "@mercurjs/types"

export const createPayoutAccountStepId = "create-payout-account"

export const createPayoutAccountStep = createStep(
  createPayoutAccountStepId,
  async (input: CreatePayoutAccountDTO, { container }) => {
    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const payoutAccount = await service.createPayoutAccount(input)

    return new StepResponse(payoutAccount, payoutAccount.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }

    await container.resolve<IPayoutModuleService>(MercurModules.PAYOUT).deletePayoutAccount(id)
  }
)
