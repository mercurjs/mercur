import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ProductChangeStatus } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-edit/service"

export const confirmProductChangesStepId = "pc-confirm-product-changes"

type ConfirmProductChangesStepInput = Array<{
  id: string
  confirmed_by?: string
  internal_note?: string
  external_note?: string
}>

type PrevChangeScalar = {
  id: string
  status: ProductChangeStatus
  confirmed_by: string | null
  confirmed_at: Date | null
  internal_note: string | null
  external_note: string | null
}

const pickPrev = (
  c: Record<string, unknown> & { id: string },
): PrevChangeScalar => ({
  id: c.id,
  status: c.status as ProductChangeStatus,
  confirmed_by: (c.confirmed_by as string | null) ?? null,
  confirmed_at: (c.confirmed_at as Date | null) ?? null,
  internal_note: (c.internal_note as string | null) ?? null,
  external_note: (c.external_note as string | null) ?? null,
})

/**
 * Pattern-match `medusa/packages/core/core-flows/src/order/steps/confirm-order-changes.ts:26-62`:
 * capture before-state, transition to CONFIRMED, revert restores the
 * captured fields. Does **not** apply action side-effects — that's the
 * deferred `applyProductChangeActionsWorkflow`'s job.
 */
export const confirmProductChangesStep = createStep(
  confirmProductChangesStepId,
  async (input: ConfirmProductChangesStepInput, { container }) => {
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
    )

    const ids = input.map((i) => i.id)
    const prev = (await service.listProductChanges({ id: ids })) as Array<
      Record<string, unknown> & { id: string }
    >
    const prevScalars = prev.map(pickPrev)

    const now = new Date()
    const updates = input.map((item) => ({
      id: item.id,
      status: ProductChangeStatus.CONFIRMED,
      confirmed_by: item.confirmed_by ?? null,
      confirmed_at: now,
      ...(item.internal_note !== undefined
        ? { internal_note: item.internal_note }
        : {}),
      ...(item.external_note !== undefined
        ? { external_note: item.external_note }
        : {}),
    }))

    const result = await service.updateProductChanges(updates)
    return new StepResponse(result, prevScalars)
  },
  async (prevScalars: PrevChangeScalar[] | undefined, { container }) => {
    if (!prevScalars?.length) {
      return
    }
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
    )
    await service.updateProductChanges(prevScalars)
  },
)
