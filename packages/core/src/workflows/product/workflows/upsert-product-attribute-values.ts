import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpsertProductAttributeValueDTO } from "@mercurjs/types"

import { upsertProductAttributeValuesStep } from "../steps/upsert-product-attribute-values"
import { validateAttributeAcceptsValuesStep } from "../steps/validate-attribute-accepts-values"

export const upsertProductAttributeValuesWorkflowId =
  "mercur-upsert-product-attribute-values"

type UpsertProductAttributeValuesWorkflowInput = {
  attribute_id: string
  values: UpsertProductAttributeValueDTO[]
}

export const upsertProductAttributeValuesWorkflow = createWorkflow(
  upsertProductAttributeValuesWorkflowId,
  function (input: UpsertProductAttributeValuesWorkflowInput) {
    validateAttributeAcceptsValuesStep({ attribute_id: input.attribute_id })

    const valueInputs = transform({ input }, ({ input }) =>
      input.values.map((v) =>
        v.id ? v : { ...v, attribute_id: input.attribute_id }
      )
    )

    const values = upsertProductAttributeValuesStep(valueInputs)

    emitEventStep({
      eventName: "product_attribute_value.updated",
      data: transform({ values }, ({ values }) =>
        values.map((v: any) => ({ id: v.id }))
      ),
    })

    return new WorkflowResponse(values)
  }
)
