import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductAttributeWorkflowEvents } from "../events"
import { deleteProductAttributesStep } from "../steps"

export type DeleteProductAttributesWorkflowInput = {
  ids: string[]
} & AdditionalData

export type DeleteProductAttributesWorkflowHooks = [
  Hook<"validate", { input: DeleteProductAttributesWorkflowInput }, unknown>,
  Hook<
    "productAttributesDeleted",
    {
      ids: string[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const deleteProductAttributesWorkflowId = "delete-product-attributes"

/**
 * Soft-deletes attributes. Link rows in `product_attribute_value_link`,
 * `product_variant_attribute`, etc. are intentionally NOT dismissed here
 * — they reference values, not the attribute itself, and Mercur's
 * read-side query filters out soft-deleted attributes via
 * `deleted_at IS NULL` on the attribute join.
 */
export const deleteProductAttributesWorkflow: ReturnWorkflow<
  DeleteProductAttributesWorkflowInput,
  void,
  DeleteProductAttributesWorkflowHooks
> = createWorkflow(
  deleteProductAttributesWorkflowId,
  function (input: DeleteProductAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    deleteProductAttributesStep(input.ids)

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id })),
      ),
    })

    const productAttributesDeleted = createHook("productAttributesDeleted", {
      ids: input.ids,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributesDeleted],
    })
  },
)
