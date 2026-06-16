import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  CommissionLineDTO,
  CreateCommissionLineDTO,
  MercurModules,
} from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

type ReplaceCommissionLinesStepInput = {
  item_ids: string[]
  shipping_method_ids: string[]
  commission_lines: CreateCommissionLineDTO[]
}

export const replaceCommissionLinesStepId = "replace-commission-lines"

/**
 * Idempotent refresh: delete the order's existing commission lines (item
 * and shipping) and insert the freshly computed ones in a single step, so
 * re-running the refresh never accumulates duplicates.
 */
export const replaceCommissionLinesStep = createStep(
  replaceCommissionLinesStepId,
  async (
    input: ReplaceCommissionLinesStepInput,
    { container }
  ): Promise<StepResponse<CommissionLineDTO[]>> => {
    const service = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await service.deleteCommissionLinesForOrderItems({
      item_ids: input.item_ids,
      shipping_method_ids: input.shipping_method_ids,
    })

    if (!input.commission_lines.length) {
      return new StepResponse([])
    }

    const commissionLines = await service.upsertCommissionLines(
      input.commission_lines
    )

    return new StepResponse(commissionLines)
  }
)
