import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { deleteOffersStep } from "../steps"
import { OfferWorkflowEvents } from "../../events"

export type DeleteOffersWorkflowInput = { ids: string[] } & AdditionalData

export const deleteOffersWorkflowId = "delete-offers"

export const deleteOffersWorkflow = createWorkflow(
  deleteOffersWorkflowId,
  function (input: DeleteOffersWorkflowInput) {
    const { data: offers } = useQueryGraphStep({
      entity: "offer",
      fields: ["id", "product_id"],
      filters: { id: input.ids },
    })

    deleteOffersStep({ ids: input.ids })

    const eventData = transform({ offers }, ({ offers }) =>
      offers.map((o) => ({ id: o.id, product_id: o.product_id })),
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
  },
)
