import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import {
  retrieveProductWithChangeStep,
  validateRequestChangesStep,
  createProductChangeActionsStep,
  declineProductChangeStep,
  updateProductsStep,
} from "../steps"

export const requestProductChangesWorkflowId = "request-product-changes"

type RequestProductChangesWorkflowInput = {
  product_id: string
  rejection_reason_ids: string[]
  message?: string
  actor_id?: string
}

export const requestProductChangesWorkflow = createWorkflow(
  requestProductChangesWorkflowId,
  function (input: RequestProductChangesWorkflowInput) {
    const product = retrieveProductWithChangeStep({
      product_id: input.product_id,
    })

    validateRequestChangesStep({
      product,
      rejection_reason_ids: input.rejection_reason_ids,
    })

    const actionData = transform({ product }, ({ product }) => [
      {
        product_change_id: product.product_change.id,
        product_id: product.id,
        action: ProductChangeActionType.STATUS_CHANGE,
        details: { status: ProductStatus.CHANGES_REQUIRED },
      },
    ])

    createProductChangeActionsStep(actionData)

    const declineData = transform(
      { product, input },
      ({ product, input }) => ({
        product_change: product.product_change,
        declined_by: input.actor_id,
        declined_reason: input.message,
        rejection_reason_ids: input.rejection_reason_ids,
      }),
    )

    declineProductChangeStep(declineData)

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      data: { status: ProductStatus.CHANGES_REQUIRED },
    }))

    updateProductsStep(updateInput)

    emitEventStep({
      eventName: ProductWorkflowEvents.CHANGES_REQUESTED,
      data: { id: input.product_id },
    })

    const productChangesRequested = createHook("productChangesRequested", {
      product_id: input.product_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productChangesRequested] })
  }
)
