import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductRejectionReasonDTO } from "@mercurjs/types"

import { ProductRejectionReasonWorkflowEvents } from "../events"
import { updateProductRejectionReasonsStep } from "../steps/update-product-rejection-reasons"

export const updateProductRejectionReasonsWorkflowId =
  "update-product-rejection-reasons"

type UpdateProductRejectionReasonsWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductRejectionReasonDTO
}

export const updateProductRejectionReasonsWorkflow = createWorkflow(
  updateProductRejectionReasonsWorkflowId,
  function (input: UpdateProductRejectionReasonsWorkflowInput) {
    const reasons = updateProductRejectionReasonsStep(input)

    emitEventStep({
      eventName: ProductRejectionReasonWorkflowEvents.UPDATED,
      data: transform({ reasons }, ({ reasons }) =>
        (reasons).map((r) => ({ id: r.id }))
      ),
    })

    return new WorkflowResponse(reasons)
  }
)
