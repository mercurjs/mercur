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
import { autoConfirmProductChangeWorkflow } from "./auto-confirm-product-change"

export const productEditAddAttributeWorkflowId =
  "product-edit-add-attribute"

type ProductEditAddAttributeWorkflowInput = {
  product_id: string
  attribute_id: string
  attribute_value_ids?: string[]
  values?: string[]
  actor_id?: string
  internal_note?: string
}

/**
 * Opens a new pending `ProductChange` carrying a single `ATTRIBUTE_ADD`
 * action. Mirrors the per-item shape that
 * `ProductModuleService.addAttributesToProduct` expects.
 */
export const productEditAddAttributeWorkflow = createWorkflow(
  productEditAddAttributeWorkflowId,
  function (input: ProductEditAddAttributeWorkflowInput) {
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
      ({ changes, input }) => {
        if (!input.attribute_id) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Attribute add requires attribute_id"
          )
        }
        return [
          {
            product_change_id: changes[0].id,
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_ADD,
            details: {
              attribute_id: input.attribute_id,
              attribute_value_ids: input.attribute_value_ids,
              values: input.values,
            },
            internal_note: input.internal_note,
          },
        ]
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

    autoConfirmProductChangeWorkflow.runAsStep({
      input: transform({ change, input }, ({ change, input }) => ({
        product_id: input.product_id,
        product_change_id: change.id,
        actor_id: input.actor_id,
        internal_note: input.internal_note,
      })),
    })

    const productEditAttributeAdded = createHook(
      "productEditAttributeAdded",
      { product_id: input.product_id, change }
    )

    return new WorkflowResponse(change, {
      hooks: [productEditAttributeAdded],
    })
  }
)
