import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CreateProductChangeDTO,
  MercurModules,
  ProductChangeStatus,
} from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-change/service"

export const createProductChangeStepId = "pc-create-product-change"

/**
 * Scalar create input. Excludes `product_id` because in the new module the
 * `product ↔ change` relationship is a Module Link (`product_change_link`),
 * not a column on the change row. The link is written separately by the
 * composing workflow via `createRemoteLinkStep`. `status` is narrowed to
 * the enum (the DTO declares it as a `string`).
 */
export type CreateProductChangeStepInput = Array<
  Omit<CreateProductChangeDTO, "product_id" | "status"> & {
    status?: ProductChangeStatus
  }
>

export const createProductChangeStep = createStep(
  createProductChangeStepId,
  async (data: CreateProductChangeStepInput, { container }) => {
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
