import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../../product/events"
import {
  retrieveProductWithChangeStep,
  validateNoPendingProductChangeStep,
  createProductChangesStep,
  createProductChangeActionsStep,
} from "../steps"

export const productEditUpdateFieldsWorkflowId =
  "product-edit-update-fields"

type ProductEditUpdateFieldsWorkflowInput = {
  product_id: string
  updates: Record<string, unknown>
  actor_id?: string
  internal_note?: string
}

/**
 * Opens a new pending `ProductChange` carrying one `UPDATE` action per
 * changed top-level Product field. Throws if another pending change
 * already exists for the product. No-op fields (proposed value === current
 * value) are dropped.
 */
export const productEditUpdateFieldsWorkflow = createWorkflow(
  productEditUpdateFieldsWorkflowId,
  function (input: ProductEditUpdateFieldsWorkflowInput) {
    const product = retrieveProductWithChangeStep({
      product_id: input.product_id,
    })

    validateNoPendingProductChangeStep({ product })

    const changeInput = transform({ input }, ({ input }) => [
      { product_id: input.product_id, created_by: input.actor_id },
    ])

    const changes = createProductChangesStep(changeInput)

    const actionInputs = transform(
      { product, changes, input },
      ({ product, changes, input }) => {
        const fields = Object.keys(input.updates ?? {})
        if (!fields.length) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "No fields to update"
          )
        }

        const out: Array<{
          product_change_id: string
          product_id: string
          action: string
          details: Record<string, unknown>
          internal_note?: string
        }> = []

        for (const [field, value] of Object.entries(input.updates)) {
          const previous_value = (product as Record<string, unknown>)[field]
          if (previous_value === value) continue
          out.push({
            product_change_id: changes[0].id,
            product_id: input.product_id,
            action: ProductChangeActionType.UPDATE,
            details: { field, value, previous_value },
            internal_note: input.internal_note,
          })
        }

        if (!out.length) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "No proposed fields differ from the product's current values"
          )
        }

        return out
      }
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

    const productEditFieldsRequested = createHook(
      "productEditFieldsRequested",
      { product_id: input.product_id, change }
    )

    return new WorkflowResponse(change, {
      hooks: [productEditFieldsRequested],
    })
  }
)
