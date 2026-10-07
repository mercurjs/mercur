import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { OfferConditionDTO, UpdateOfferConditionDTO } from "@mercurjs/types"

import { updateOfferConditionsStep } from "../steps"
import { OfferConditionWorkflowEvents } from "../../events"

export type UpdateOfferConditionsWorkflowInput = {
  offer_conditions: UpdateOfferConditionDTO[]
}

export type UpdateOfferConditionsWorkflowHooks = [
  Hook<"offerConditionsUpdated", { offer_conditions: OfferConditionDTO[] }, unknown>,
]

export const updateOfferConditionsWorkflowId = "update-offer-conditions"

export const updateOfferConditionsWorkflow: ReturnWorkflow<
  UpdateOfferConditionsWorkflowInput,
  OfferConditionDTO[],
  UpdateOfferConditionsWorkflowHooks
> = createWorkflow(
  updateOfferConditionsWorkflowId,
  function (input: UpdateOfferConditionsWorkflowInput) {
    const conditions = updateOfferConditionsStep(input.offer_conditions)

    const eventData = transform({ conditions }, ({ conditions }) =>
      conditions.map((c) => ({ id: c.id }))
    )

    emitEventStep({
      eventName: OfferConditionWorkflowEvents.UPDATED,
      data: eventData,
    })

    const offerConditionsUpdated = createHook("offerConditionsUpdated", {
      offer_conditions: conditions,
    })

    return new WorkflowResponse(conditions, {
      hooks: [offerConditionsUpdated],
    })
  }
)
