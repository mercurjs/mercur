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
import {
  ProductChangeActionType,
  UpdateProductVariantDTO,
} from "@mercurjs/types"

import { ProductWorkflowEvents } from "../../product/events"
import {
  retrieveProductWithChangeStep,
  validateNoPendingProductChangeStep,
  createProductChangesStep,
  createProductChangeActionsStep,
} from "../steps"

export const productEditUpdateVariantWorkflowId =
  "product-edit-update-variant"

type ProductEditUpdateVariantWorkflowInput = {
  product_id: string
  variant_id: string
  fields: UpdateProductVariantDTO
  actor_id?: string
  internal_note?: string
}

/**
 * Opens a new pending `ProductChange` carrying a single `VARIANT_UPDATE`
 * action. Verifies the variant belongs to the product and drops no-op
 * fields. `attribute_values` bypasses the no-op check (its map shape
 * isn't comparable here — `updateProductVariants` normalizes at apply
 * time).
 */
export const productEditUpdateVariantWorkflow = createWorkflow(
  productEditUpdateVariantWorkflowId,
  function (input: ProductEditUpdateVariantWorkflowInput) {
    const product = retrieveProductWithChangeStep({
      product_id: input.product_id,
    })

    validateNoPendingProductChangeStep({ product })

    const { data: variants } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["*"],
      filters: { id: input.variant_id },
      options: { throwIfKeyNotFound: true },
    })

    const variant = transform({ variants }, ({ variants }) => variants[0])

    const changeInput = transform({ input }, ({ input }) => [
      { product_id: input.product_id, created_by: input.actor_id },
    ])

    const changes = createProductChangesStep(changeInput)

    const actionInputs = transform(
      { variant, changes, input },
      ({ variant, changes, input }) => {
        if (variant.product_id !== input.product_id) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Variant '${input.variant_id}' does not belong to product '${input.product_id}'`
          )
        }

        const incoming = input.fields ?? {}
        const fields: Record<string, unknown> = {}
        const previous_fields: Record<string, unknown> = {}

        for (const [field, value] of Object.entries(incoming)) {
          if (
            field !== "attribute_values" &&
            (variant as Record<string, unknown>)[field] === value
          ) {
            continue
          }
          fields[field] = value
          previous_fields[field] = (variant as Record<string, unknown>)[field]
        }

        if (!Object.keys(fields).length) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "No proposed variant fields differ from the variant's current values"
          )
        }

        return [
          {
            product_change_id: changes[0].id,
            product_id: input.product_id,
            action: ProductChangeActionType.VARIANT_UPDATE,
            details: {
              variant_id: input.variant_id,
              fields,
              previous_fields,
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

    const productEditVariantUpdated = createHook(
      "productEditVariantUpdated",
      { product_id: input.product_id, change }
    )

    return new WorkflowResponse(change, {
      hooks: [productEditVariantUpdated],
    })
  }
)
