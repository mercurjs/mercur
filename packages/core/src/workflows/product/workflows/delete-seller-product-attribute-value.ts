import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductAttributeValueWorkflowEvents } from "../events"
import { deleteProductAttributeValuesStep } from "../steps/delete-product-attribute-values"
import { validateAttributeOwnershipStep } from "../steps/validate-attribute-ownership"

export const deleteSellerProductAttributeValueWorkflowId =
  "delete-seller-product-attribute-value"

type DeleteSellerProductAttributeValueWorkflowInput = {
  seller_id: string
  attribute_id: string
  value_id: string
}

export const deleteSellerProductAttributeValueWorkflow = createWorkflow(
  deleteSellerProductAttributeValueWorkflowId,
  function (input: DeleteSellerProductAttributeValueWorkflowInput) {
    validateAttributeOwnershipStep({
      attribute_id: input.attribute_id,
      seller_id: input.seller_id,
    })

    const ids = transform({ input }, ({ input }) => [input.value_id])

    deleteProductAttributeValuesStep(ids)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) => [{ id: input.value_id }]),
    })

    return new WorkflowResponse(void 0)
  }
)
