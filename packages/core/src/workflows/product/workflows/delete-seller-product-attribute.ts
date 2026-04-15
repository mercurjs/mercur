import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductAttributeWorkflowEvents } from "../events"
import { deleteProductAttributesStep } from "../steps/delete-product-attributes"
import { validateAttributeOwnershipStep } from "../steps/validate-attribute-ownership"

export const deleteSellerProductAttributeWorkflowId =
  "delete-seller-product-attribute"

type DeleteSellerProductAttributeWorkflowInput = {
  seller_id: string
  id: string
}

export const deleteSellerProductAttributeWorkflow = createWorkflow(
  deleteSellerProductAttributeWorkflowId,
  function (input: DeleteSellerProductAttributeWorkflowInput) {
    validateAttributeOwnershipStep({
      attribute_id: input.id,
      seller_id: input.seller_id,
    })

    const ids = transform({ input }, ({ input }) => [input.id])

    deleteProductAttributesStep(ids)

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) => [{ id: input.id }]),
    })

    return new WorkflowResponse(void 0)
  }
)
