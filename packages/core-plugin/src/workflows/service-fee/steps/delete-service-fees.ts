import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const deleteServiceFeesStepId = "delete-service-fees-step"

export const deleteServiceFeesStep = createStep(
  deleteServiceFeesStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.softDeleteServiceFees(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.restoreServiceFees(ids)
  }
)
