import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, TransferDTO, UpdateTransferDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const updateTransferStepId = "update-transfer"

export const updateTransferStep = createStep(
  updateTransferStepId,
  async (input: UpdateTransferDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const previous = await service.retrieveTransfer(input.id)
    const transfer: TransferDTO = await service.updateTransfers({
      ...input,
      amount: input.amount === undefined ? undefined : Number(input.amount),
    })

    return new StepResponse(transfer, {
      id: input.id,
      status: previous.status,
      status_reason: previous.status_reason,
    })
  },
  async (previous, { container }) => {
    if (!previous) return
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    await service.updateTransfers(previous)
  }
)
