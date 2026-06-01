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
import { ProductDTO } from "@mercurjs/types"

import { updateProductsStep } from "../steps"

export const updateProductsWorkflowId = "mercur-update-products"

export type UpdateProductsWorkflowInput = {
  selector: Record<string, unknown>
  data: Record<string, unknown>
} & AdditionalData

export type UpdateProductsWorkflowHooks = [
  Hook<
    "productsUpdated",
    {
      products: ProductDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateProductsWorkflow: ReturnWorkflow<
  UpdateProductsWorkflowInput,
  ProductDTO[],
  UpdateProductsWorkflowHooks
> = createWorkflow(
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
      eventName: "product.updated",
      data: eventData,
    })

    return new WorkflowResponse(products, { hooks: [productsUpdated] })
  }
)
