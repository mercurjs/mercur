import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const logServiceFeeChangeStepId = "log-service-fee-change-step"

export const logServiceFeeChangeStep = createStep(
  logServiceFeeChangeStepId,
  async (
    input: {
      service_fee_id: string
      action: string
      changed_by: string | null
      previous_snapshot: Record<string, unknown> | null
      new_snapshot: Record<string, unknown> | null
    },
    { container }
  ) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const log = await service.logChange(
      input.service_fee_id,
      input.action,
      input.changed_by,
      input.previous_snapshot,
      input.new_snapshot
    )
    return new StepResponse(log)
  }
)
