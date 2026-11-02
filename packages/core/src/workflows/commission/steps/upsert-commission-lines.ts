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

type UpsertCommissionLinesCompensation = {
  created_ids: string[]
  replaced: CommissionLineDTO[]
}

const anchorFilters = (lines: CreateCommissionLineDTO[]) => {
  const itemIds = lines
    .map((line) => line.item_id)
    .filter((id): id is string => !!id)
  const shippingMethodIds = lines
    .map((line) => line.shipping_method_id)
    .filter((id): id is string => !!id)

  const filters: Record<string, unknown>[] = []
  if (itemIds.length) {
    filters.push({ item_id: itemIds })
  }
  if (shippingMethodIds.length) {
    filters.push({ shipping_method_id: shippingMethodIds })
  }
  return filters
}

export const upsertCommissionLinesStepId = "upsert-commission-lines"

export const upsertCommissionLinesStep = createStep(
  upsertCommissionLinesStepId,
  async (
    input: UpsertCommissionLinesStepInput,
    { container }
  ): Promise<
    StepResponse<CommissionLineDTO[], UpsertCommissionLinesCompensation>
  > => {
    if (!input.commission_lines.length) {
      return new StepResponse([], { created_ids: [], replaced: [] })
    }

    const service = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const filters = anchorFilters(input.commission_lines)
    const replaced = filters.length
      ? await service.listCommissionLines({ $or: filters })
      : []

    const commissionLines = await service.upsertCommissionLines(
      input.commission_lines
    )

    return new StepResponse(commissionLines, {
      created_ids: commissionLines.map((line) => line.id),
      replaced,
    })
  },
  async (compensation, { container }) => {
    if (!compensation?.created_ids.length) {
      return
    }

    const service = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    // Restore each anchor to its pre-step state: remove the lines the step
    // wrote, then put back the ones it replaced.
    await service.deleteCommissionLines(compensation.created_ids)

    const replacedLines = compensation.replaced.map((line) => ({
      id: line.id,
      item_id: line.item_id,
      shipping_method_id: line.shipping_method_id,
      commission_rate_id: line.commission_rate_id,
      provider_id: line.provider_id,
      code: line.code,
      rate: line.rate,
      amount: line.amount,
      description: line.description,
      data: line.data,
    }))

    if (replacedLines.length) {
      await service.createCommissionLines(replacedLines)
    }
  }
)
