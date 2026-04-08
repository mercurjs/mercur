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

    // Snapshot prior state for compensation rollback
    const previousStates = await Promise.all(
      input.map(async (dto) => {
        const [fee] = await service.listServiceFees({ id: dto.id })
        return fee ? JSON.parse(JSON.stringify(fee)) : null
      })
    )

    const serviceFees = await service.updateServiceFees(input)
    return new StepResponse(serviceFees, previousStates.filter(Boolean))
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    // Restore from prior state snapshot
    await service.updateServiceFees(
      prevData.map((prev: any) => ({
        id: prev.id,
        name: prev.name,
        display_name: prev.display_name,
        code: prev.code,
        type: prev.type,
        target: prev.target,
        status: prev.status,
        value: prev.value,
        is_enabled: prev.is_enabled,
        priority: prev.priority,
      })) as any
    )
  }
)
