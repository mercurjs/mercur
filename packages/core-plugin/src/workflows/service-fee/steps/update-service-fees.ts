import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateServiceFeeDTO, MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const updateServiceFeesStepId = "update-service-fees-step"

export const updateServiceFeesStep = createStep(
  updateServiceFeesStepId,
  async (input: UpdateServiceFeeDTO[], { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const serviceFees = await service.updateServiceFees(input)
    return new StepResponse(serviceFees, input)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.updateServiceFees(prevData)
  }
)
