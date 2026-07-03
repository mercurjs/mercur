import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ProductChangeStatus } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-edit/service"

export const cancelProductChangeStepId = "pc-cancel-product-change"

type CancelProductChangeStepInput = {
  id: string
  canceled_by?: string
}

type PrevChangeScalar = {
  id: string
  status: ProductChangeStatus
  canceled_by: string | null
  canceled_at: Date | null
}

export const cancelProductChangeStep = createStep(
  cancelProductChangeStepId,
  async (input: CancelProductChangeStepInput, { container }) => {
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
      canceled_by: (prev.canceled_by as string | null) ?? null,
      canceled_at: (prev.canceled_at as Date | null) ?? null,
    }

    const result = await service.updateProductChanges([
      {
        id: input.id,
        status: ProductChangeStatus.CANCELED,
        canceled_by: input.canceled_by ?? null,
        canceled_at: new Date(),
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
