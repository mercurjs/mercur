import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { deleteOffersStep } from "../steps"
import { OfferWorkflowEvents } from "../../events"

export type DeleteOffersWorkflowInput = {
  ids: string[]
} & AdditionalData

export const deleteOffersWorkflowId = "delete-offers"

export const deleteOffersWorkflow = createWorkflow(
  deleteOffersWorkflowId,
  function (input: DeleteOffersWorkflowInput) {
    deleteOffersStep(input.ids)

    const eventData = transform({ input }, ({ input }) =>
      input.ids.map((id) => ({ id }))
    )

    emitEventStep({
      eventName: OfferWorkflowEvents.DELETED,
      data: eventData,
    })

    const offersDeleted = createHook("offersDeleted", {
      ids: input.ids,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, { hooks: [offersDeleted] })
  }
)
