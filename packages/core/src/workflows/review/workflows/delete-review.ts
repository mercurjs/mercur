import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { deleteReviewStep } from "../steps"
import { buildReviewEventData, linkedReviewFields } from "../utils"
import { ReviewWorkflowEvents } from "../../events"

export const deleteReviewWorkflow = createWorkflow(
  {
    name: "delete-review",
  },
  function (id: string) {
    // Read the target up front: the review is soft-deleted below and its links
    // stop resolving afterwards.
    const { data: linked } = useQueryGraphStep({
      entity: "review",
      fields: linkedReviewFields,
      filters: { id },
    })

    deleteReviewStep(id)

    const eventData = transform({ linked }, ({ linked }) =>
      buildReviewEventData(linked)
    )

    emitEventStep({
      eventName: ReviewWorkflowEvents.DELETED,
      data: eventData,
    })

    return new WorkflowResponse(id)
  }
)
