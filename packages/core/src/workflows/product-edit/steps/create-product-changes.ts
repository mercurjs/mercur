import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CreateProductChangeDTO,
  MercurModules,
  ProductChangeStatus,
} from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-edit/service"

export const createProductChangesStepId = "pc-create-product-changes"

export type CreateProductChangesStepInput = Array<
  Omit<CreateProductChangeDTO, "status"> & {
    status?: ProductChangeStatus
  }
>

export const createProductChangesStep = createStep(
  createProductChangesStepId,
  async (data: CreateProductChangesStepInput, { container }) => {
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_EDIT,
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
      MercurModules.PRODUCT_EDIT,
    )
    await service.deleteProductChanges(ids)
  },
)
