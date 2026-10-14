import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { RespondReviewDTO } from "@mercurjs/types"

import { respondReviewStep } from "../steps"
import { buildReviewEventData, linkedReviewFields } from "../utils"
import { ReviewWorkflowEvents } from "../../events"

export const respondReviewWorkflow = createWorkflow(
  {
    name: "respond-review",
  },
  function (input: RespondReviewDTO) {
    const review = respondReviewStep(input)

    const { data: linked } = useQueryGraphStep({
      entity: "review",
      fields: linkedReviewFields,
      filters: { id: input.id },
    })

    const eventData = transform({ linked }, ({ linked }) =>
      buildReviewEventData(linked)
    )

    emitEventStep({
      eventName: ReviewWorkflowEvents.RESPONDED,
      data: eventData,
    })

    return new WorkflowResponse(review)
  }
)
