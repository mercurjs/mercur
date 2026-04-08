import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ServiceFeeCalculationContext,
  CreateServiceFeeLineDTO,
  MercurModules,
} from "@mercurjs/types"
import { promiseAll } from "@medusajs/framework/utils"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const getServiceFeeLinesStepId = "get-service-fee-lines-step"

export const getServiceFeeLinesStep = createStep(
  getServiceFeeLinesStepId,
  async (
    input: ServiceFeeCalculationContext[],
    { container }
  ): Promise<StepResponse<CreateServiceFeeLineDTO[]>> => {
    const service = container.resolve(
      MercurModules.SERVICE_FEE
    ) as ServiceFeeModuleService
    const feeLines = await promiseAll(
      input.map((ctx) => service.getServiceFeeLines(ctx))
    )
    return new StepResponse(feeLines.flat())
  }
)
