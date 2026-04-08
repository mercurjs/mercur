import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ServiceFeeStatus } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const deactivateServiceFeeStepId = "deactivate-service-fee-step"

export const deactivateServiceFeeStep = createStep(
  deactivateServiceFeeStepId,
  async (
    input: { id: string; changed_by?: string },
    { container }
  ) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const deactivated = await service.deactivateServiceFee(
      input.id,
      input.changed_by
    )
    return new StepResponse(deactivated, input.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.updateServiceFees([
      { id, status: ServiceFeeStatus.ACTIVE, is_enabled: true },
    ] as any)
  }
)
