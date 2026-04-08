import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateServiceFeeRuleDTO, MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const updateServiceFeeRulesStepId = "update-service-fee-rules-step"

export const updateServiceFeeRulesStep = createStep(
  updateServiceFeeRulesStepId,
  async (input: UpdateServiceFeeRuleDTO[], { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const rules = await service.updateServiceFeeRules(input)
    return new StepResponse(rules, input)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.updateServiceFeeRules(prevData)
  }
)
