import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  CommissionLineDTO,
  CreateCommissionLineDTO,
  UpdateCommissionLineDTO,
} from "@mercurjs/types"

import { COMMISSION_MODULE } from "../../../modules/commission"
import CommissionModuleService from "../../../modules/commission/service"

type UpsertCommissionLinesStepInput = {
  commission_lines: (CreateCommissionLineDTO | UpdateCommissionLineDTO)[]
}

export const upsertCommissionLinesStepId = "upsert-commission-lines"

export const upsertCommissionLinesStep = createStep(
  upsertCommissionLinesStepId,
  async (
    input: UpsertCommissionLinesStepInput,
    { container }
  ): Promise<StepResponse<CommissionLineDTO[]>> => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const commissionLines = await service.upsertCommissionLines(
      input.commission_lines
    )

    return new StepResponse(commissionLines)
  }
)
