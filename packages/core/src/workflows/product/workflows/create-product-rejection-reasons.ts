import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductRejectionReasonDTO } from "@mercurjs/types"

import { ProductRejectionReasonWorkflowEvents } from "../events"
import { createProductRejectionReasonsStep } from "../steps/create-product-rejection-reasons"

export const createProductRejectionReasonsWorkflowId =
  "create-product-rejection-reasons"

type CreateProductRejectionReasonsWorkflowInput = {
  reasons: CreateProductRejectionReasonDTO[]
}

export const createProductRejectionReasonsWorkflow = createWorkflow(
  createProductRejectionReasonsWorkflowId,
  function (input: CreateProductRejectionReasonsWorkflowInput) {
    const reasons = createProductRejectionReasonsStep(input.reasons)

    emitEventStep({
      eventName: ProductRejectionReasonWorkflowEvents.CREATED,
      data: transform({ reasons }, ({ reasons }) =>
        (reasons).map((r) => ({ id: r.id }))
      ),
    })

    return new WorkflowResponse(reasons)
  }
)
