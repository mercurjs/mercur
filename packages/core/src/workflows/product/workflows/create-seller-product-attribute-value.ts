import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductAttributeValueDTO } from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import { createProductAttributeValuesStep } from "../steps/create-product-attribute-values"
import { validateAttributeAcceptsValuesStep } from "../steps/validate-attribute-accepts-values"
import { validateAttributeOwnershipStep } from "../steps/validate-attribute-ownership"

export const createSellerProductAttributeValueWorkflowId =
  "create-seller-product-attribute-value"

type CreateSellerProductAttributeValueWorkflowInput = {
  seller_id: string
  attribute_id: string
  values: CreateProductAttributeValueDTO[]
}

export const createSellerProductAttributeValueWorkflow = createWorkflow(
  createSellerProductAttributeValueWorkflowId,
  function (input: CreateSellerProductAttributeValueWorkflowInput) {
    validateAttributeOwnershipStep({
      attribute_id: input.attribute_id,
      seller_id: input.seller_id,
    })

    validateAttributeAcceptsValuesStep({ attribute_id: input.attribute_id })

    const valueInputs = transform({ input }, ({ input }) =>
      input.values.map((v) => ({ ...v, attribute_id: input.attribute_id }))
    )

    const values = createProductAttributeValuesStep(valueInputs)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.CREATED,
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id }))
      ),
    })

    return new WorkflowResponse(values)
  }
)
