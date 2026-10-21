import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  CommissionCalculationContext,
  CreateCommissionLineDTO,
  MercurModules,
} from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export const getCommissionLinesStepId = "get-commission-lines"

export const getCommissionLinesStep = createStep(
  getCommissionLinesStepId,
  async (
    input: CommissionCalculationContext[],
    { container }
  ): Promise<StepResponse<CreateCommissionLineDTO[]>> => {
    if (!input.length) {
      return new StepResponse([])
    }

    const service =
      container.resolve(MercurModules.COMMISSION) as CommissionModuleService

    const commissionLines = await service.getCommissionLinesBatch(input)

    return new StepResponse(commissionLines.flat())
  }
)
