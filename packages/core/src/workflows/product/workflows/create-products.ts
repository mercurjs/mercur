import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductDTO, ProductStatus } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { createProductsStep } from "../steps"
import { linkSellersToProductWorkflow } from "./link-sellers-to-product"

export const createProductsWorkflowId = "create-products"

type CreateProductsWorkflowInput = {
  products: CreateProductDTO[]
  seller_ids?: string[]
} & AdditionalData

export const createProductsWorkflow = createWorkflow(
  createProductsWorkflowId,
  function (input: CreateProductsWorkflowInput) {
    const validate = createHook("validate", {
      input,
      products: input.products,
    })

    const normalizedProducts = transform({ input }, ({ input }) =>
      input.products.map((p) => ({
        ...p,
        is_active: true,
      }))
    )

    const products = createProductsStep(normalizedProducts)

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
