import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ProductChangeStatus } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../_step5-pending/modules/product-change/service"

export const resubmitProductChangeStepId = "pc-resubmit-product-change"

type ResubmitProductChangeStepInput = {
  id: string
}

type PrevChangeScalar = {
  id: string
  status: ProductChangeStatus
  requires_action_by: string | null
  requires_action_at: Date | null
  requires_action_reason: string | null
}

/**
 * Transitions a `REQUIRES_ACTION` change back to `PENDING`. Capture
 * before-state for revert.
 */
export const resubmitProductChangeStep = createStep(
  resubmitProductChangeStepId,
  async (input: ResubmitProductChangeStepInput, { container }) => {
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_CHANGE,
    )

    const prev = (await service.retrieveProductChange(input.id)) as Record<
      string,
      unknown
    > & { id: string }

    const prevScalar: PrevChangeScalar = {
      id: prev.id,
      status: prev.status as ProductChangeStatus,
      requires_action_by:
        (prev.requires_action_by as string | null) ?? null,
      requires_action_at: (prev.requires_action_at as Date | null) ?? null,
      requires_action_reason:
        (prev.requires_action_reason as string | null) ?? null,
    }

    const result = await service.updateProductChanges([
      {
        id: input.id,
        status: ProductChangeStatus.PENDING,
        requires_action_by: null,
        requires_action_at: null,
        requires_action_reason: null,
      },
    ])

    return new StepResponse(result[0], prevScalar)
  },
  async (prevScalar: PrevChangeScalar | undefined, { container }) => {
    if (!prevScalar) {
      return
    }
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_CHANGE,
    )
    await service.updateProductChanges([prevScalar])
  },
)
