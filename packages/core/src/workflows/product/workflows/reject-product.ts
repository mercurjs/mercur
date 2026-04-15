import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import {
  validateRejectProductStep,
  createProductChangeActionStep,
  declineProductChangeStep,
  updateProductsStep,
} from "../steps"

export const rejectProductWorkflowId = "reject-product"

type RejectProductWorkflowInput = {
  product_id: string
  rejection_reason_ids: string[]
  message?: string
  actor_id?: string
}

export const rejectProductWorkflow = createWorkflow(
  rejectProductWorkflowId,
  function (input: RejectProductWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status", "product_change.*"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-product" })

    const product = transform({ products }, ({ products }) => products[0])

    validateRejectProductStep({
      product,
      rejection_reason_ids: input.rejection_reason_ids,
    })

    const actionData = transform({ product }, ({ product }) => [
      {
        product_change_id: product.product_change.id,
        product_id: product.id,
        action: ProductChangeActionType.STATUS_CHANGE,
        details: { status: ProductStatus.REJECTED },
      },
    ])

    createProductChangeActionStep(actionData)

    const declineData = transform(
      { product, input },
      ({ product, input }) => (
        {
          product_change: product.product_change,
          declined_by: input.actor_id,
          declined_reason: input.message,
          rejection_reason_ids: input.rejection_reason_ids,
        }),
    )

    declineProductChangeStep(declineData)

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      data: { status: ProductStatus.REJECTED },
    }))

    updateProductsStep(updateInput)

    const eventData = transform({ input }, ({ input }) => ({
      id: input.product_id,
      reasons: input.rejection_reason_ids,
      message: input.message,
    }))

    emitEventStep({
      eventName: ProductWorkflowEvents.REJECTED,
      data: eventData,
    })

    const productRejected = createHook("productRejected", {
      product_id: input.product_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productRejected] })
  }
)
