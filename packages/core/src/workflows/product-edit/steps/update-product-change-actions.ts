import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-edit/service"

export const updateProductChangeActionsStepId =
  "pc-update-product-change-actions"

type UpdateProductChangeActionsStepInput = Array<{
  id: string
  applied?: boolean
  details?: Record<string, unknown>
  internal_note?: string | null
}>

type PrevActionScalar = {
  id: string
  applied: boolean
  details: Record<string, unknown>
  internal_note: string | null
}

const pickPrev = (
  a: Record<string, unknown> & { id: string },
): PrevActionScalar => ({
  id: a.id,
  applied: (a.applied as boolean) ?? false,
  details: (a.details as Record<string, unknown>) ?? {},
  internal_note: (a.internal_note as string | null) ?? null,
})

/**
 * Pattern-match
 * `medusa/packages/core/core-flows/src/order/steps/update-order-change-actions.ts:21-60`:
 * list-before, update, revert updates with before-state.
 */
export const updateProductChangeActionsStep = createStep(
  updateProductChangeActionsStepId,
  async (input: UpdateProductChangeActionsStepInput, { container }) => {
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
    )

    const ids = input.map((i) => i.id)
    const prev = (await service.listProductChangeActions({
      id: ids,
    })) as Array<Record<string, unknown> & { id: string }>
    const prevScalars = prev.map(pickPrev)

    const result = await service.updateProductChangeActions(input)
    return new StepResponse(result, prevScalars)
  },
  async (prevScalars: PrevActionScalar[] | undefined, { container }) => {
    if (!prevScalars?.length) {
      return
    }
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
    )
    await service.updateProductChangeActions(prevScalars)
  },
)
