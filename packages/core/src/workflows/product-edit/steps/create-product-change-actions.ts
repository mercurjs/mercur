import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductChangeActionDTO, MercurModules } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-edit/service"

export const createProductChangeActionsStepId =
  "pc-create-product-change-actions"

/**
 * Batch sibling of `addProductChangeActionStep`. Persists a full
 * `ProductChangeAction` set in one round-trip — used by the vendor
 * "edit" orchestrators that compute many actions per submission.
 */
export const createProductChangeActionsStep = createStep(
  createProductChangeActionsStepId,
  async (data: CreateProductChangeActionDTO[], { container }) => {
    if (!data.length) {
      return new StepResponse([], [])
    }
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
    )
    const created = await service.createProductChangeActions(data)
    return new StepResponse(
      created,
      created.map((a) => a.id),
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
    )
    await service.deleteProductChangeActions(ids)
  },
)
