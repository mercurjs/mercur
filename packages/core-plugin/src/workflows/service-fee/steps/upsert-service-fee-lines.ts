import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CreateServiceFeeLineDTO,
  UpdateServiceFeeLineDTO,
  MercurModules,
} from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const upsertServiceFeeLinesStepId = "upsert-service-fee-lines-step"

export const upsertServiceFeeLinesStep = createStep(
  upsertServiceFeeLinesStepId,
  async (
    input: (CreateServiceFeeLineDTO | UpdateServiceFeeLineDTO)[],
    { container }
  ) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const feeLines = await service.upsertServiceFeeLines(input)
    return new StepResponse(
      feeLines,
      feeLines.map((l) => l.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.deleteServiceFeeLines(ids)
  }
)
