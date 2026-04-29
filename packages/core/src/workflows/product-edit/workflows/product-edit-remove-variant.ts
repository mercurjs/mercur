import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../../product/events"
import {
  retrieveProductWithChangeStep,
  validateNoPendingProductChangeStep,
  createProductChangesStep,
  createProductChangeActionsStep,
} from "../steps"

export const productEditRemoveVariantWorkflowId =
  "product-edit-remove-variant"

type ProductEditRemoveVariantWorkflowInput = {
  product_id: string
  variant_id: string
  actor_id?: string
  internal_note?: string
}

/**
 * Opens a new pending `ProductChange` carrying a single `VARIANT_REMOVE`
 * action. Verifies the variant belongs to the product.
 */
export const productEditRemoveVariantWorkflow = createWorkflow(
  productEditRemoveVariantWorkflowId,
  function (input: ProductEditRemoveVariantWorkflowInput) {
    const product = retrieveProductWithChangeStep({
      product_id: input.product_id,
    })

    validateNoPendingProductChangeStep({ product })

    const { data: variants } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "product_id"],
      filters: { id: input.variant_id },
      options: { throwIfKeyNotFound: true },
    })

    const changeInput = transform({ input }, ({ input }) => [
      { product_id: input.product_id, created_by: input.actor_id },
    ])

    const changes = createProductChangesStep(changeInput)

    const actionInputs = transform(
      { variants, changes, input },
      ({ variants, changes, input }) => {
        const variant = variants[0]
        if (variant.product_id !== input.product_id) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Variant '${input.variant_id}' does not belong to product '${input.product_id}'`
          )
        }

        return [
          {
            product_change_id: changes[0].id,
            product_id: input.product_id,
            action: ProductChangeActionType.VARIANT_REMOVE,
            details: { variant_id: input.variant_id },
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

    const productEditVariantRemoved = createHook(
      "productEditVariantRemoved",
      { product_id: input.product_id, change }
    )

    return new WorkflowResponse(change, {
      hooks: [productEditVariantRemoved],
    })
  }
)
