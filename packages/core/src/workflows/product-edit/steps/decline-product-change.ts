import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ProductChangeStatus } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-edit/service"

export const declineProductChangeStepId = "pc-decline-product-change"

type DeclineProductChangeStepInput = {
  id: string
  declined_by?: string
  declined_reason?: string
}

type PrevChangeScalar = {
  id: string
  status: ProductChangeStatus
  declined_by: string | null
  declined_at: Date | null
  declined_reason: string | null
}

/**
 * Pattern-match `medusa/packages/core/core-flows/src/order/steps/decline-order-change.ts:17-44`:
 * capture before-state, transition to DECLINED, revert restores the
 * captured fields.
 */
export const declineProductChangeStep = createStep(
  declineProductChangeStepId,
  async (input: DeclineProductChangeStepInput, { container }) => {
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
    )

    const prev = (await service.retrieveProductChange(input.id)) as Record<
      string,
      unknown
    > & { id: string }

    const prevScalar: PrevChangeScalar = {
      id: prev.id,
      status: prev.status as ProductChangeStatus,
      declined_by: (prev.declined_by as string | null) ?? null,
      declined_at: (prev.declined_at as Date | null) ?? null,
      declined_reason: (prev.declined_reason as string | null) ?? null,
    }

    const result = await service.updateProductChanges([
      {
        id: input.id,
        status: ProductChangeStatus.DECLINED,
        declined_by: input.declined_by ?? null,
        declined_at: new Date(),
        ...(input.declined_reason !== undefined
          ? { declined_reason: input.declined_reason }
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
      MercurModules.PRODUCT_EDIT,
    )
    await service.updateProductChanges([prevScalar])
  },
)
