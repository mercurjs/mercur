import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { validateRequestChangesStep, updateProductsStep } from "../steps"
import {
  createProductChangesStep,
  createProductChangeActionsStep,
} from "../../product-edit/steps"

export const requestProductChangesWorkflowId = "request-product-changes"

type RequestProductChangesWorkflowInput = {
  product_id: string
  rejection_reason_ids?: string[]
  message?: string
  actor_id?: string
}

export const requestProductChangesWorkflow = createWorkflow(
  requestProductChangesWorkflowId,
  function (input: RequestProductChangesWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-product" })

    const product = transform({ products }, ({ products }) => products[0])

    validateRequestChangesStep({
      product,
      rejection_reason_ids: input.rejection_reason_ids,
    })

    const changeData = transform(
      { product, input },
      ({ product, input }) => [
        { product_id: product.id, created_by: input.actor_id },
      ]
    )

    const changes = createProductChangesStep(changeData)

    const actionData = transform(
      { changes, product },
      ({ changes, product }) => [
        {
          product_change_id: changes[0].id,
          product_id: product.id,
          action: ProductChangeActionType.STATUS_CHANGE,
          details: { status: ProductStatus.REQUIRES_ACTION },
        },
      ]
    )

    createProductChangeActionsStep(actionData)

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      data: { status: ProductStatus.REQUIRES_ACTION },
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
