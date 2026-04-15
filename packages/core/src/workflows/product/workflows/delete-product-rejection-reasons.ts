import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductRejectionReasonWorkflowEvents } from "../events"
import { deleteProductRejectionReasonsStep } from "../steps/delete-product-rejection-reasons"

export const deleteProductRejectionReasonsWorkflowId =
  "delete-product-rejection-reasons"

type DeleteProductRejectionReasonsWorkflowInput = {
  ids: string[]
}

export const deleteProductRejectionReasonsWorkflow = createWorkflow(
  deleteProductRejectionReasonsWorkflowId,
  function (input: DeleteProductRejectionReasonsWorkflowInput) {
    deleteProductRejectionReasonsStep(input.ids)

    emitEventStep({
      eventName: ProductRejectionReasonWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id }))
      ),
    })

    return new WorkflowResponse(void 0)
  }
)
