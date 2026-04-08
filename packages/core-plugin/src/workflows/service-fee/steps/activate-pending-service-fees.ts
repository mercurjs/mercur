import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ServiceFeeStatus } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const activatePendingServiceFeesStepId =
  "activate-pending-service-fees-step"

export const activatePendingServiceFeesStep = createStep(
  activatePendingServiceFeesStepId,
  async (_input: void, { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const activated = await service.activatePendingFees()
    return new StepResponse(
      activated,
      activated.map((f) => f.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.updateServiceFees(
      ids.map((id) => ({
        id,
        status: ServiceFeeStatus.PENDING,
        is_enabled: false,
      })) as any
    )
  }
)
