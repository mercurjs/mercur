import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateServiceFeeRuleDTO, MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const createServiceFeeRulesStepId = "create-service-fee-rules-step"

export const createServiceFeeRulesStep = createStep(
  createServiceFeeRulesStepId,
  async (
    input: { service_fee_id: string; rules: CreateServiceFeeRuleDTO[] },
    { container }
  ) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const rules = await service.createServiceFeeRules(
      input.rules.map((r) => ({
        ...r,
        service_fee_id: input.service_fee_id,
      }))
    )
    return new StepResponse(
      rules,
      rules.map((r) => r.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.deleteServiceFeeRules(ids)
  }
)
