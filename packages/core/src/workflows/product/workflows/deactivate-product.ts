import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductWorkflowEvents } from "../events"
import { updateProductsStep } from "../steps"

export const deactivateProductWorkflowId = "deactivate-product"

type DeactivateProductWorkflowInput = {
  product_id: string
}

export const deactivateProductWorkflow = createWorkflow(
  deactivateProductWorkflowId,
  function (input: DeactivateProductWorkflowInput) {
    useQueryGraphStep({
      entity: "product",
      fields: ["id", "status", "is_active"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-product" })

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      data: { is_active: false },
    }))

    updateProductsStep(updateInput)

    emitEventStep({
      eventName: ProductWorkflowEvents.DEACTIVATED,
      data: { id: input.product_id },
    })

    const productDeactivated = createHook("productDeactivated", {
      product_id: input.product_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productDeactivated] })
  }
)
