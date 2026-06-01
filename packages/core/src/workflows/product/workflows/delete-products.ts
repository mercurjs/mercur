import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  deleteProductsWorkflow as stockDeleteProductsWorkflow,
  emitEventStep,
} from "@medusajs/medusa/core-flows"

export type DeleteProductsWorkflowInput = {
  ids: string[]
}

export const deleteProductsWorkflowId = "mercur-delete-products"

/**
 * Marketplace wrapper over stock `deleteProductsWorkflow`. Stock handles
 * variant cascade + inventory cleanup; Mercur emits an additional
 * `product.deleted` event after deletion completes. Module-Link rows
 * (`product_seller_authorization`, `product_attribute_value_link`,
 * `product_change_link`) are dropped automatically via the link runtime
 * when their owning product row is removed.
 */
export const deleteProductsWorkflow = createWorkflow(
  deleteProductsWorkflowId,
  function (input: DeleteProductsWorkflowInput) {
    stockDeleteProductsWorkflow.runAsStep({ input: { ids: input.ids } })

    emitEventStep({
      eventName: "product.deleted",
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id }))
      ),
    })

    return new WorkflowResponse(void 0)
  }
)
