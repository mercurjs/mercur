import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductAttributeValueDTO } from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import { updateProductAttributeValuesStep } from "../steps/update-product-attribute-values"
import { validateAttributeOwnershipStep } from "../steps/validate-attribute-ownership"

export const updateSellerProductAttributeValueWorkflowId =
  "update-seller-product-attribute-value"

type UpdateSellerProductAttributeValueWorkflowInput = {
  seller_id: string
  attribute_id: string
  value_id: string
  update: UpdateProductAttributeValueDTO
}

export const updateSellerProductAttributeValueWorkflow = createWorkflow(
  updateSellerProductAttributeValueWorkflowId,
  function (input: UpdateSellerProductAttributeValueWorkflowInput) {
    validateAttributeOwnershipStep({
      attribute_id: input.attribute_id,
      seller_id: input.seller_id,
    })

    const stepInput = transform({ input }, ({ input }) => ({
      selector: { id: input.value_id, attribute_id: input.attribute_id },
      update: input.update,
    }))

    const values = updateProductAttributeValuesStep(stepInput)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.UPDATED,
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id }))
      ),
    })

    return new WorkflowResponse(
      transform({ values }, ({ values }) => values[0])
    )
  }
)
