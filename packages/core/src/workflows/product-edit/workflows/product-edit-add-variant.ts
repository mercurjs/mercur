import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  CreateProductVariantDTO,
  ProductChangeActionType,
} from "@mercurjs/types"

import { ProductWorkflowEvents } from "../../product/events"
import {
  retrieveProductWithChangeStep,
  validateNoPendingProductChangeStep,
  createProductChangesStep,
  createProductChangeActionsStep,
} from "../steps"
import { autoConfirmProductChangeWorkflow } from "./auto-confirm-product-change"

export const productEditAddVariantWorkflowId = "product-edit-add-variant"

type ProductEditAddVariantWorkflowInput = {
  product_id: string
  variant: CreateProductVariantDTO
  actor_id?: string
  internal_note?: string
}

/**
 * Opens a new pending `ProductChange` carrying a single `VARIANT_ADD`
 * action. Throws if a pending change already exists for the product.
 */
export const productEditAddVariantWorkflow = createWorkflow(
  productEditAddVariantWorkflowId,
  function (input: ProductEditAddVariantWorkflowInput) {
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
          action: ProductChangeActionType.VARIANT_ADD,
          details: { variant: input.variant },
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

    const productEditVariantAdded = createHook("productEditVariantAdded", {
      product_id: input.product_id,
      change,
    })

    return new WorkflowResponse(change, {
      hooks: [productEditVariantAdded],
    })
  }
)
