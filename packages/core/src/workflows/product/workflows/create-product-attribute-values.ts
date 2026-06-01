import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductAttributeValueDTO } from "@mercurjs/types"

import { createProductAttributeValuesStep } from "../steps/create-product-attribute-values"
import { validateAttributeAcceptsValuesStep } from "../steps/validate-attribute-accepts-values"

export const createProductAttributeValuesWorkflowId =
  "mercur-create-product-attribute-values"

type CreateProductAttributeValuesWorkflowInput = {
  attribute_id: string
  values: CreateProductAttributeValueDTO[]
}

export const createProductAttributeValuesWorkflow = createWorkflow(
  createProductAttributeValuesWorkflowId,
  function (input: CreateProductAttributeValuesWorkflowInput) {
    validateAttributeAcceptsValuesStep({ attribute_id: input.attribute_id })

    const valueInputs = transform({ input }, ({ input }) =>
      input.values.map((v) => ({ ...v, attribute_id: input.attribute_id }))
    )

    const values = createProductAttributeValuesStep(valueInputs)

    emitEventStep({
      eventName: "product_attribute_value.created",
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id }))
      ),
    })

    return new WorkflowResponse(values)
  }
)
