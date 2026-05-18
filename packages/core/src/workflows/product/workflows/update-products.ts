import {
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductWorkflowEvents } from "../events"
import { updateProductsStep } from "../steps"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const updateProductsWorkflowId = "update-products"

type UpdateProductsWorkflowInput = {
  selector: Record<string, unknown>
  data: Record<string, unknown>
} & AdditionalData

export const updateProductsWorkflow: ReturnType<typeof createIdempotentWorkflow> = createIdempotentWorkflow(
  updateProductsWorkflowId,
  function (input: UpdateProductsWorkflowInput) {
    const products = updateProductsStep(input)

    const productsUpdated = createHook("productsUpdated", {
      products,
      additional_data: input.additional_data,
    })

    const eventData = transform({ products }, ({ products }) =>
      (products).map((p) => ({ id: p.id }))
    )

    emitEventStep({
      eventName: ProductWorkflowEvents.UPDATED,
      data: eventData,
    })

    return new WorkflowResponse(products, { hooks: [productsUpdated] })
  }
)
