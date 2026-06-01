import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductBrandDTO } from "@mercurjs/types"

import { updateProductBrandsStep } from "../steps/update-product-brands"

export const updateProductBrandsWorkflowId = "mercur-update-product-brands"

type UpdateProductBrandsWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductBrandDTO
}

export const updateProductBrandsWorkflow = createWorkflow(
  updateProductBrandsWorkflowId,
  function (input: UpdateProductBrandsWorkflowInput) {
    const brands = updateProductBrandsStep(input)

    const eventData = transform({ brands }, ({ brands }) =>
      (brands).map((b) => ({ id: b.id }))
    )

    emitEventStep({
      eventName: "product_brand.updated",
      data: eventData,
    })

    return new WorkflowResponse(brands)
  }
)
