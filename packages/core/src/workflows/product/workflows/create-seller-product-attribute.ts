import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductAttributeDTO } from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import { createProductAttributesStep } from "../steps/create-product-attributes"

export const createSellerProductAttributeWorkflowId =
  "create-seller-product-attribute"

type CreateSellerProductAttributeWorkflowInput = {
  seller_id: string
  attribute: Omit<CreateProductAttributeDTO, "created_by">
}

export const createSellerProductAttributeWorkflow = createWorkflow(
  createSellerProductAttributeWorkflowId,
  function (input: CreateSellerProductAttributeWorkflowInput) {
    const attributeData = transform({ input }, ({ input }) => [
      { ...input.attribute, created_by: input.seller_id },
    ])

    const attributes = createProductAttributesStep(attributeData)

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.CREATED,
      data: transform({ attributes }, ({ attributes }) =>
        attributes.map((a) => ({ id: a.id }))
      ),
    })

    return new WorkflowResponse(
      transform({ attributes }, ({ attributes }) => attributes[0])
    )
  }
)
