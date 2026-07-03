import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  CommissionLineDTO,
  CreateCommissionLineDTO,
  MercurModules,
} from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

type UpsertCommissionLinesStepInput = {
  commission_lines: CreateCommissionLineDTO[]
}

export const upsertCommissionLinesStepId = "upsert-commission-lines"

export const upsertCommissionLinesStep = createStep(
  upsertCommissionLinesStepId,
  async (
    input: UpsertCommissionLinesStepInput,
    { container }
  ): Promise<StepResponse<CommissionLineDTO[]>> => {
    const service = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const commissionLines = await service.upsertCommissionLines(
      input.commission_lines
    )

    return new StepResponse(commissionLines)
  }
)
