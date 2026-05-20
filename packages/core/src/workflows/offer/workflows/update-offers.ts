import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { updateOffersStep } from "../steps"
import { OfferWorkflowEvents } from "../../events"

export type UpdateOffersWorkflowInput = {
  offers: Array<{
    id: string
    sku?: string
    shipping_profile_id?: string
    metadata?: Record<string, unknown> | null
  }>
} & AdditionalData

export const updateOffersWorkflowId = "update-offers"

export const updateOffersWorkflow = createWorkflow(
  updateOffersWorkflowId,
  function (input: UpdateOffersWorkflowInput) {
    const validate = createHook("validate", { input })

    const offers = updateOffersStep(transform(input, ({ offers }) => offers))

    const eventData = transform({ offers }, ({ offers }) =>
      offers.map((o) => ({ id: o.id }))
    )

    emitEventStep({
      eventName: OfferWorkflowEvents.UPDATED,
      data: eventData,
    })

    const offersUpdated = createHook("offersUpdated", {
      offers,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(offers, {
      hooks: [validate, offersUpdated],
    })
  }
)
