import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { deleteReviewStep } from "../steps"
import { buildReviewEventData, LinkedReview } from "../utils"
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
      fields: ["id", "reference", "product.id", "seller.id"],
      filters: { id },
    })

    deleteReviewStep(id)

    // Deleting an unknown id is a no-op, so only announce a review that existed.
    when({ linked }, ({ linked }) => linked.length > 0).then(() => {
      const eventData = transform({ linked }, ({ linked }) =>
        buildReviewEventData(linked[0] as LinkedReview)
      )

      emitEventStep({
        eventName: ReviewWorkflowEvents.DELETED,
        data: eventData,
      })
    })

    return new WorkflowResponse(id)
  }
)
