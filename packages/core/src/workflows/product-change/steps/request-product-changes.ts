import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ProductChangeStatus } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../_step5-pending/modules/product-change/service"

export const requestProductChangesStepId = "pc-request-product-changes"

type RequestProductChangesStepInput = {
  id: string
  requires_action_by?: string
  requires_action_reason?: string
  external_note?: string
}

type PrevChangeScalar = {
  id: string
  status: ProductChangeStatus
  requires_action_by: string | null
  requires_action_at: Date | null
  requires_action_reason: string | null
  external_note: string | null
}

/**
 * Same shape as `declineProductChangeStep`: capture before-state, transition
 * the existing pending change to `REQUIRES_ACTION`, revert restores the
 * captured fields. This is the transition that flips the computed
 * `Product.requires_action` boolean to `true` (resolved at read time by
 * scanning linked changes).
 */
export const requestProductChangesStep = createStep(
  requestProductChangesStepId,
  async (input: RequestProductChangesStepInput, { container }) => {
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
      external_note: (prev.external_note as string | null) ?? null,
    }

    const result = await service.updateProductChanges([
      {
        id: input.id,
        status: ProductChangeStatus.REQUIRES_ACTION,
        requires_action_by: input.requires_action_by ?? null,
        requires_action_at: new Date(),
        ...(input.requires_action_reason !== undefined
          ? { requires_action_reason: input.requires_action_reason }
          : {}),
        ...(input.external_note !== undefined
          ? { external_note: input.external_note }
          : {}),
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
