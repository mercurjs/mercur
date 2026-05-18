import {
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductBrandDTO } from "@mercurjs/types"

import { ProductBrandWorkflowEvents } from "../events"
import { updateProductBrandsStep } from "../steps/update-product-brands"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const updateProductBrandsWorkflowId = "update-product-brands"

type UpdateProductBrandsWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductBrandDTO
}

export const updateProductBrandsWorkflow = createIdempotentWorkflow(
  updateProductBrandsWorkflowId,
  function (input: UpdateProductBrandsWorkflowInput) {
    const brands = updateProductBrandsStep(input)

    const eventData = transform({ brands }, ({ brands }) =>
      (brands).map((b) => ({ id: b.id }))
    )

    emitEventStep({
      eventName: ProductBrandWorkflowEvents.UPDATED,
      data: eventData,
    })

    return new WorkflowResponse(brands)
  }
)
