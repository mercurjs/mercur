import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductDTO, ProductDTO } from "@mercurjs/types"

import { createProductsStep } from "../steps"
import { linkSellersToProductWorkflow } from "./link-sellers-to-product"

export const createProductsWorkflowId = "mercur-create-products"

export type CreateProductsWorkflowInput = {
  products: CreateProductDTO[]
  seller_ids?: string[]
} & AdditionalData

export type CreateProductsWorkflowHooks = [
  Hook<
    "validate",
    {
      input: CreateProductsWorkflowInput
      products: CreateProductDTO[]
    },
    unknown
  >,
  Hook<
    "productsCreated",
    {
      products: ProductDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createProductsWorkflow: ReturnWorkflow<
  CreateProductsWorkflowInput,
  ProductDTO[],
  CreateProductsWorkflowHooks
> = createWorkflow(
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
      eventName: "product.created",
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
