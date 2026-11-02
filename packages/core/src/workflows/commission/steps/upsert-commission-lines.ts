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

    await service.deleteCommissionLines(compensation.created_ids)

    if (compensation.replaced.length) {
      await service.createCommissionLines(
        compensation.replaced.map(
          ({ created_at, updated_at, deleted_at, ...line }) => line
        )
      )
    }
  }
)
