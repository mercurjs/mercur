import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductAttributeDTO } from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import { updateProductAttributesStep } from "../steps/update-product-attributes"
import { validateAttributeOwnershipStep } from "../steps/validate-attribute-ownership"

export const updateSellerProductAttributeWorkflowId =
  "update-seller-product-attribute"

type UpdateSellerProductAttributeWorkflowInput = {
  seller_id: string
  id: string
  update: UpdateProductAttributeDTO
}

export const updateSellerProductAttributeWorkflow = createWorkflow(
  updateSellerProductAttributeWorkflowId,
  function (input: UpdateSellerProductAttributeWorkflowInput) {
    validateAttributeOwnershipStep({
      attribute_id: input.id,
      seller_id: input.seller_id,
    })

    const stepInput = transform({ input }, ({ input }) => ({
      selector: { id: input.id },
      update: input.update,
    }))

    const attributes = updateProductAttributesStep(stepInput)

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.UPDATED,
      data: transform({ attributes }, ({ attributes }) =>
        attributes.map((a) => ({ id: a.id }))
      ),
    })

    return new WorkflowResponse(
      transform({ attributes }, ({ attributes }) => attributes[0])
    )
  }
)
