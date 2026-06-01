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
import { ProductVariantDTO, UpdateProductVariantDTO } from "@mercurjs/types"

import { ProductVariantWorkflowEvents } from "@medusajs/framework/utils"
import {
  updateProductVariantsStep,
  UpdateProductVariantsStepInput,
} from "../steps/update-product-variants"

export const updateProductVariantsWorkflowId = "mercur-update-product-variants"

export type UpdateProductVariantsWorkflowInput = (
  | {
      selector: Record<string, unknown>
      update: UpdateProductVariantDTO
    }
  | {
      product_variants: (UpdateProductVariantDTO & { id: string })[]
    }
) &
  AdditionalData

export type UpdateProductVariantsWorkflowHooks = [
  Hook<
    "productVariantsUpdated",
    {
      product_variants: ProductVariantDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateProductVariantsWorkflow: ReturnWorkflow<
  UpdateProductVariantsWorkflowInput,
  ProductVariantDTO[],
  UpdateProductVariantsWorkflowHooks
> = createWorkflow(
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
