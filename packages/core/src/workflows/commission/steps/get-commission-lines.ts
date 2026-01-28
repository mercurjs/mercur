import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  CommissionCalculationContext,
  CreateCommissionLineDTO,
} from "@mercurjs/types"

import { COMMISSION_MODULE } from "../../../modules/commission"
import CommissionModuleService from "../../../modules/commission/service"

export const getCommissionLinesStepId = "get-commission-lines"

export const getCommissionLinesStep = createStep(
  getCommissionLinesStepId,
  async (
    input: CommissionCalculationContext,
    { container }
  ): Promise<StepResponse<CreateCommissionLineDTO[]>> => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const commissionLines = await service.getCommissionLines(input)

    return new StepResponse(commissionLines)
  }
)
