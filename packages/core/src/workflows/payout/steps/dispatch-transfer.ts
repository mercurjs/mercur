import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, TransferDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const dispatchTransferStepId = "dispatch-transfer"

export const dispatchTransferStep = createStep(
  dispatchTransferStepId,
  async (input: { transfer_id: string }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const transfer: TransferDTO = await service.dispatchTransfer(input.transfer_id)

    return new StepResponse(transfer)
  }
)
