import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  ProductAttributeDTO,
  UpdateProductAttributeDTO,
} from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import { updateProductAttributesStep } from "../steps"

export type UpdateProductAttributesWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeDTO
} & AdditionalData

export type UpdateProductAttributesWorkflowHooks = [
  Hook<"validate", { input: UpdateProductAttributesWorkflowInput }, unknown>,
  Hook<
    "productAttributesUpdated",
    {
      attributes: ProductAttributeDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateProductAttributesWorkflowId = "update-product-attributes"

export const updateProductAttributesWorkflow: ReturnWorkflow<
  UpdateProductAttributesWorkflowInput,
  ProductAttributeDTO[],
  UpdateProductAttributesWorkflowHooks
> = createWorkflow(
  updateProductAttributesWorkflowId,
  function (input: UpdateProductAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    const attributes = updateProductAttributesStep({
      selector: input.selector,
      update: input.update,
    })

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.UPDATED,
      data: transform({ attributes }, ({ attributes }) =>
        attributes.map((a) => ({ id: a.id })),
      ),
    })

    const productAttributesUpdated = createHook("productAttributesUpdated", {
      attributes,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(attributes as ProductAttributeDTO[], {
      hooks: [validate, productAttributesUpdated],
    })
  },
)
