import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { UpdateReviewDTO } from "@mercurjs/types"

import { updateReviewStep } from "../steps"
import { buildReviewEventData, LinkedReview } from "../utils"
import { ReviewWorkflowEvents } from "../../events"

export const updateReviewWorkflow = createWorkflow(
  {
    name: "update-review",
  },
  function (input: UpdateReviewDTO) {
    const review = updateReviewStep(input)

    const { data: linked } = useQueryGraphStep({
      entity: "review",
      fields: ["id", "reference", "product.id", "seller.id"],
      filters: { id: input.id },
    })

    const eventData = transform({ linked }, ({ linked }) =>
      buildReviewEventData(linked[0] as LinkedReview)
    )

    emitEventStep({
      eventName: ReviewWorkflowEvents.UPDATED,
      data: eventData,
    })

    return new WorkflowResponse(review)
  }
)
