import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateServiceFeeDTO, MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const createServiceFeesStepId = "create-service-fees-step"

export const createServiceFeesStep = createStep(
  createServiceFeesStepId,
  async (input: CreateServiceFeeDTO[], { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    // Strip rules from input — rules are created separately via batch-rules workflow
    const feesInput = input.map(({ rules, ...rest }) => rest)
    const result = await service.createServiceFees(feesInput as any)
    const serviceFees = Array.isArray(result) ? result : [result]
    return new StepResponse(
      serviceFees,
      serviceFees.map((f: any) => f.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.deleteServiceFees(ids)
  }
)
