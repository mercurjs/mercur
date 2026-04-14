import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductDTO } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { createProductsStep } from "../steps"

export const createProductsWorkflowId = "create-products"

type CreateProductsWorkflowInput = {
  products: CreateProductDTO[]
} & AdditionalData

export const createProductsWorkflow = createWorkflow(
  createProductsWorkflowId,
  function (input: CreateProductsWorkflowInput) {
    const products = createProductsStep(input.products)

    const productsCreated = createHook("productsCreated", {
      products,
      additional_data: input.additional_data,
    })

    const eventData = transform({ products }, ({ products }) =>
      (products as any[]).map((p) => ({ id: p.id }))
    )

    emitEventStep({
      eventName: ProductWorkflowEvents.CREATED,
      data: eventData,
    })

    return new WorkflowResponse(products, { hooks: [productsCreated] })
  }
)
