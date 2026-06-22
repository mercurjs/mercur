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
  ProductAttributeValueDTO,
  UpdateProductAttributeValueDTO,
} from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import { updateProductAttributeValuesStep } from "../steps"

export type UpdateProductAttributeValuesWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeValueDTO
} & AdditionalData

export type UpdateProductAttributeValuesWorkflowHooks = [
  Hook<
    "validate",
    { input: UpdateProductAttributeValuesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributeValuesUpdated",
    {
      values: ProductAttributeValueDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateProductAttributeValuesWorkflowId =
  "update-product-attribute-values"

export const updateProductAttributeValuesWorkflow: ReturnWorkflow<
  UpdateProductAttributeValuesWorkflowInput,
  ProductAttributeValueDTO[],
  UpdateProductAttributeValuesWorkflowHooks
> = createWorkflow(
  updateProductAttributeValuesWorkflowId,
  function (input: UpdateProductAttributeValuesWorkflowInput) {
    const validate = createHook("validate", { input })

    const values = updateProductAttributeValuesStep({
      selector: input.selector,
      update: input.update,
    })

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.UPDATED,
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id })),
      ),
    })

    const productAttributeValuesUpdated = createHook(
      "productAttributeValuesUpdated",
      {
        values,
        additional_data: input.additional_data,
      },
    )

    return new WorkflowResponse(values as ProductAttributeValueDTO[], {
      hooks: [validate, productAttributeValuesUpdated],
    })
  },
)
