import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductVariantDTO, ProductVariantDTO } from "@mercurjs/types"

import { ProductVariantWorkflowEvents } from "@medusajs/framework/utils"
import { createProductVariantsStep } from "../steps/create-product-variants"

export const createProductVariantsWorkflowId = "mercur-create-product-variants"

export type CreateProductVariantsWorkflowInput = {
  product_variants: CreateProductVariantDTO[]
} & AdditionalData

export type CreateProductVariantsWorkflowHooks = [
  Hook<
    "productVariantsCreated",
    {
      product_variants: ProductVariantDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createProductVariantsWorkflow: ReturnWorkflow<
  CreateProductVariantsWorkflowInput,
  ProductVariantDTO[],
  CreateProductVariantsWorkflowHooks
> = createWorkflow(
  createProductVariantsWorkflowId,
  function (input: CreateProductVariantsWorkflowInput) {
    const variants = createProductVariantsStep(input.product_variants)

    const productVariantsCreated = createHook("productVariantsCreated", {
      product_variants: variants,
      additional_data: input.additional_data,
    })

    const eventData = transform({ variants }, ({ variants }) =>
      variants.map((v) => ({ id: v.id }))
    )

    emitEventStep({
      eventName: ProductVariantWorkflowEvents.CREATED,
      data: eventData,
    })

    return new WorkflowResponse(variants, {
      hooks: [productVariantsCreated],
    })
  }
)
