import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CreateProductChangeDTO,
  MercurModules,
  ProductChangeStatus,
} from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-change/service"

export const createProductChangesStepId = "pc-create-product-changes"

/**
 * Scalar create input. `product_id` is a real column on the
 * `ProductChange` model (read-only link to `Product`), so it gets
 * inserted directly with each change row. `status` is narrowed to the
 * enum.
 */
export type CreateProductChangesStepInput = Array<
  Omit<CreateProductChangeDTO, "status"> & {
    status?: ProductChangeStatus
  }
>

export const createProductChangesStep = createStep(
  createProductChangesStepId,
  async (data: CreateProductChangesStepInput, { container }) => {
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_CHANGE,
    )
    const changes = await service.createProductChanges(data)
    return new StepResponse(
      changes,
      changes.map((c) => c.id),
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_CHANGE,
    )
    await service.deleteProductChanges(ids)
  },
)
