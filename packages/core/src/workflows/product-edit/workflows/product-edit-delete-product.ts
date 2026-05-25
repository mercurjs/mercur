import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../../product/events"
import {
  retrieveProductWithChangeStep,
  validateNoPendingProductChangeStep,
  createProductChangesStep,
  createProductChangeActionsStep,
} from "../steps"
import { autoConfirmProductChangeWorkflow } from "./auto-confirm-product-change"

export const productEditDeleteProductWorkflowId =
  "product-edit-delete-product"

type ProductEditDeleteProductWorkflowInput = {
  product_id: string
  actor_id?: string
  internal_note?: string
}

/**
 * Opens a new pending `ProductChange` carrying a single `PRODUCT_DELETE`
 * action — proposes soft-deleting the product when the change is
 * confirmed. Throws if a pending change already exists for the product.
 *
 * Distinct from a direct `deleteProducts` call: deletion only takes
 * effect after operator confirmation, so vendors cannot remove products
 * unilaterally once the change-review pipeline is in use.
 */
export const productEditDeleteProductWorkflow = createWorkflow(
  productEditDeleteProductWorkflowId,
  function (input: ProductEditDeleteProductWorkflowInput) {
    const product = retrieveProductWithChangeStep({
      product_id: input.product_id,
    })

    validateNoPendingProductChangeStep({ product })

    const changeInput = transform({ input }, ({ input }) => [
      { product_id: input.product_id, created_by: input.actor_id },
    ])

    const changes = createProductChangesStep(changeInput)

    const actionInputs = transform(
      { changes, input },
      ({ changes, input }) => [
        {
          product_change_id: changes[0].id,
          product_id: input.product_id,
          action: ProductChangeActionType.PRODUCT_DELETE,
          details: {},
          internal_note: input.internal_note,
        },
      ]
    )

    createProductChangeActionsStep(actionInputs)

    const change = transform({ changes }, ({ changes }) => changes[0])

    emitEventStep({
      eventName: ProductWorkflowEvents.EDIT_REQUESTED,
      data: transform({ input, change }, ({ input, change }) => ({
        id: input.product_id,
        change_id: (change as any).id,
      })),
    })

    autoConfirmProductChangeWorkflow.runAsStep({
      input: transform({ change, input }, ({ change, input }) => ({
        product_id: input.product_id,
        product_change_id: change.id,
        actor_id: input.actor_id,
        internal_note: input.internal_note,
      })),
    })

    const productEditDeleteRequested = createHook(
      "productEditDeleteRequested",
      { product_id: input.product_id, change }
    )

    return new WorkflowResponse(change, {
      hooks: [productEditDeleteRequested],
    })
  }
)
