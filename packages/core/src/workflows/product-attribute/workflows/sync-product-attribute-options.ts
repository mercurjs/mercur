import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteProductOptionsWorkflow } from "@medusajs/medusa/core-flows"

import {
  upsertProductOptionsForAxisStep,
  type UpsertProductOptionsForAxisInput,
} from "../steps"

export type SyncProductAttributeOptionsWorkflowInput = {
  /**
   * Variant-axis product options to upsert. Each entry adds the value
   * names to an existing `(product_id, title)` option or creates a
   * fresh one.
   */
  upsert?: UpsertProductOptionsForAxisInput
  /**
   * Product option ids to delete. Used when detaching the last
   * variant-axis attribute of a given option from a product.
   */
  delete_ids?: string[]
}

export const syncProductAttributeOptionsWorkflowId =
  "sync-product-attribute-options"

/**
 * Building block for the variant-axis ↔ product-option sync. Existing
 * callers (`addProductAttributeWorkflow`,
 * `detachProductAttributeWorkflow`, `batchProductAttributeValuesWorkflow`,
 * `applyProductAttributeChangeActionsWorkflow`) routed through this
 * workflow get consistent ordering: upsert first, then delete, never
 * parallelized.
 */
export const syncProductAttributeOptionsWorkflow = createWorkflow(
  syncProductAttributeOptionsWorkflowId,
  function (input: SyncProductAttributeOptionsWorkflowInput) {
    upsertProductOptionsForAxisStep(
      transform({ input }, ({ input }) => input.upsert ?? []),
    )

    when({ input }, ({ input }) => !!input.delete_ids?.length).then(() => {
      deleteProductOptionsWorkflow.runAsStep({
        input: transform({ input }, ({ input }) => ({
          ids: input.delete_ids ?? [],
        })),
      })
    })

    return new WorkflowResponse(void 0)
  },
)
