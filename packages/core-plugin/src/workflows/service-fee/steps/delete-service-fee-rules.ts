import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const deleteServiceFeeRulesStepId = "delete-service-fee-rules-step"

export const deleteServiceFeeRulesStep = createStep(
  deleteServiceFeeRulesStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.softDeleteServiceFeeRules(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.restoreServiceFeeRules(ids)
  }
)
