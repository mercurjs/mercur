import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductWorkflowEvents } from "../events"
import { updateProductsStep, validateActivateProductStep } from "../steps"

export const activateProductWorkflowId = "activate-product"

type ActivateProductWorkflowInput = {
  product_id: string
}

export const activateProductWorkflow = createWorkflow(
  activateProductWorkflowId,
  function (input: ActivateProductWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status", "is_active"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-product" })

    const product = transform({ products }, ({ products }) => products[0])

    validateActivateProductStep({ product })

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      update: { is_active: true },
    }))

    updateProductsStep(updateInput)

    emitEventStep({
      eventName: ProductWorkflowEvents.ACTIVATED,
      data: { id: input.product_id },
    })

    const productActivated = createHook("productActivated", {
      product_id: input.product_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productActivated] })
  }
)
