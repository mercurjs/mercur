import {
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductVariantDTO } from "@mercurjs/types"

import { ProductVariantWorkflowEvents } from "../events"
import { createProductVariantsStep } from "../steps/create-product-variants"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const createProductVariantsWorkflowId = "create-product-variants"

type CreateProductVariantsWorkflowInput = {
  product_variants: CreateProductVariantDTO[]
} & AdditionalData

export const createProductVariantsWorkflow: ReturnType<typeof createIdempotentWorkflow> = createIdempotentWorkflow(
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
