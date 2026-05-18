import {
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductVariantDTO } from "@mercurjs/types"

import { ProductVariantWorkflowEvents } from "../events"
import {
  updateProductVariantsStep,
  UpdateProductVariantsStepInput,
} from "../steps/update-product-variants"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const updateProductVariantsWorkflowId = "update-product-variants"

type UpdateProductVariantsWorkflowInput = (
  | {
      selector: Record<string, unknown>
      update: UpdateProductVariantDTO
    }
  | {
      product_variants: (UpdateProductVariantDTO & { id: string })[]
    }
) &
  AdditionalData

export const updateProductVariantsWorkflow: ReturnType<typeof createIdempotentWorkflow> = createIdempotentWorkflow(
  updateProductVariantsWorkflowId,
  function (input: UpdateProductVariantsWorkflowInput) {
    const stepInput = transform({ input }, (data) => {
      if ("product_variants" in data.input) {
        return {
          product_variants: data.input.product_variants,
        } as UpdateProductVariantsStepInput
      }
      return {
        selector: data.input.selector,
        update: data.input.update,
      } as UpdateProductVariantsStepInput
    })

    const variants = updateProductVariantsStep(stepInput)

    const productVariantsUpdated = createHook("productVariantsUpdated", {
      product_variants: variants,
      additional_data: input.additional_data,
    })

    const eventData = transform({ variants }, ({ variants }) =>
      (variants as { id: string }[]).map((v) => ({ id: v.id }))
    )

    emitEventStep({
      eventName: ProductVariantWorkflowEvents.UPDATED,
      data: eventData,
    })

    return new WorkflowResponse(variants, {
      hooks: [productVariantsUpdated],
    })
  }
)
