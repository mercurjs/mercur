import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpsertProductAttributeValueDTO } from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import { upsertProductAttributeValuesStep } from "../steps/upsert-product-attribute-values"
import { validateAttributeAcceptsValuesStep } from "../steps/validate-attribute-accepts-values"

export const upsertProductAttributeValuesWorkflowId =
  "upsert-product-attribute-values"

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
      eventName: ProductAttributeValueWorkflowEvents.UPDATED,
      data: transform({ values }, ({ values }) =>
        values.map((v: any) => ({ id: v.id }))
      ),
    })

    return new WorkflowResponse(values)
  }
)
