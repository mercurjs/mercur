import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import {
  deleteOfferConditionsStep,
  validateOfferConditionsDeletableStep,
} from "../steps"
import { OfferConditionWorkflowEvents } from "../../events"

export type DeleteOfferConditionsWorkflowInput = {
  ids: string[]
}

export type DeleteOfferConditionsWorkflowHooks = [
  Hook<"offerConditionsDeleted", { ids: string[] }, unknown>,
]

export const deleteOfferConditionsWorkflowId = "delete-offer-conditions"

export const deleteOfferConditionsWorkflow: ReturnWorkflow<
  DeleteOfferConditionsWorkflowInput,
  void,
  DeleteOfferConditionsWorkflowHooks
> = createWorkflow(
  deleteOfferConditionsWorkflowId,
  function (input: DeleteOfferConditionsWorkflowInput) {
    validateOfferConditionsDeletableStep(input.ids)

    deleteOfferConditionsStep(input.ids)

    const eventData = transform({ input }, ({ input }) =>
      input.ids.map((id) => ({ id }))
    )

    emitEventStep({
      eventName: OfferConditionWorkflowEvents.DELETED,
      data: eventData,
    })

    const offerConditionsDeleted = createHook("offerConditionsDeleted", {
      ids: input.ids,
    })

    return new WorkflowResponse(void 0, {
      hooks: [offerConditionsDeleted],
    })
  }
)
