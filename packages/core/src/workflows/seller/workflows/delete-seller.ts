import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { deleteSellersStep } from "../steps"
import { SellerWorkflowEvents } from "../../events"

export const deleteSellersWorkflowId = "delete-sellers"

type DeleteSellersWorkflowInput = {
  ids: string[]
}

export const deleteSellersWorkflow = createWorkflow(
  deleteSellersWorkflowId,
  function (input: DeleteSellersWorkflowInput) {
    deleteSellersStep(input.ids)

    const eventData = transform({ input }, ({ input }) =>
      input.ids.map((id) => ({ id }))
    )

    emitEventStep({
      eventName: SellerWorkflowEvents.DELETED,
      data: eventData,
    })

    return new WorkflowResponse(void 0)
  }
)
