import {
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductDTO } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { createProductsStep } from "../steps"
import { linkSellersToProductWorkflow } from "./link-sellers-to-product"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const createProductsWorkflowId = "create-products"

type CreateProductsWorkflowInput = {
  products: CreateProductDTO[]
  seller_ids?: string[]
} & AdditionalData

export const createProductsWorkflow: ReturnType<typeof createIdempotentWorkflow> = createIdempotentWorkflow(
  createProductsWorkflowId,
  function (input: CreateProductsWorkflowInput) {
    const validate = createHook("validate", {
      input,
      products: input.products,
    })

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

    const linkInput = transform(
      { input, products },
      ({ input, products }) => ({
        id: (products as any[])[0]?.id,
        add: input.seller_ids ?? [],
      })
    )

    linkSellersToProductWorkflow.runAsStep({ input: linkInput })

    return new WorkflowResponse(products, {
      hooks: [validate, productsCreated] as const,
    })
  }
)
