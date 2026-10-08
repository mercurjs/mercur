import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateOfferConditionDTO, OfferConditionDTO } from "@mercurjs/types"

import { createOfferConditionsStep } from "../steps"
import { OfferConditionWorkflowEvents } from "../../events"

export type CreateOfferConditionsWorkflowInput = {
  offer_conditions: CreateOfferConditionDTO[]
}

export type CreateOfferConditionsWorkflowHooks = [
  Hook<"offerConditionsCreated", { offer_conditions: OfferConditionDTO[] }, unknown>,
]

export const createOfferConditionsWorkflowId = "create-offer-conditions"

export const createOfferConditionsWorkflow: ReturnWorkflow<
  CreateOfferConditionsWorkflowInput,
  OfferConditionDTO[],
  CreateOfferConditionsWorkflowHooks
> = createWorkflow(
  createOfferConditionsWorkflowId,
  function (input: CreateOfferConditionsWorkflowInput) {
    const conditions = createOfferConditionsStep(input.offer_conditions)

    const eventData = transform({ conditions }, ({ conditions }) =>
      conditions.map((c) => ({ id: c.id }))
    )

    emitEventStep({
      eventName: OfferConditionWorkflowEvents.CREATED,
      data: eventData,
    })

    const offerConditionsCreated = createHook("offerConditionsCreated", {
      offer_conditions: conditions,
    })

    return new WorkflowResponse(conditions, {
      hooks: [offerConditionsCreated],
    })
  }
)
