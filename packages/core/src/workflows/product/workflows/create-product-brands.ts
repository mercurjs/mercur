import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductBrandDTO } from "@mercurjs/types"

import { createProductBrandsStep } from "../steps/create-product-brands"

export const createProductBrandsWorkflowId = "mercur-create-product-brands"

type CreateProductBrandsWorkflowInput = {
  brands: CreateProductBrandDTO[]
}

export const createProductBrandsWorkflow = createWorkflow(
  createProductBrandsWorkflowId,
  function (input: CreateProductBrandsWorkflowInput) {
    const brands = createProductBrandsStep(input.brands)

    const eventData = transform({ brands }, ({ brands }) =>
      (brands).map((b) => ({ id: b.id }))
    )

    emitEventStep({
      eventName: "product_brand.created",
      data: eventData,
    })

    return new WorkflowResponse(brands)
  }
)
