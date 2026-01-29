import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  CommissionCalculationContext,
  CreateCommissionLineDTO,
} from "@mercurjs/types"

import { COMMISSION_MODULE } from "../../../modules/commission"
import CommissionModuleService from "../../../modules/commission/service"
import { promiseAll } from "@medusajs/framework/utils"

export const getCommissionLinesStepId = "get-commission-lines"

export const getCommissionLinesStep = createStep(
  getCommissionLinesStepId,
  async (
    input: CommissionCalculationContext[],
    { container }
  ): Promise<StepResponse<CreateCommissionLineDTO[]>> => {
    const service =
      container.resolve(COMMISSION_MODULE) as CommissionModuleService


    const commissionLines = await promiseAll(
      input.map(async (context) => {
        return await service.getCommissionLines(context)
      })
    )

    return new StepResponse(commissionLines.flat())
  }
)
