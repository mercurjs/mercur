import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { RespondReviewDTO } from "@mercurjs/types"

import { respondReviewStep } from "../steps"
import { buildReviewEventData, LinkedReview } from "../utils"
import { ReviewWorkflowEvents } from "../../events"

export const respondReviewWorkflow = createWorkflow(
  {
    name: "respond-review",
  },
  function (input: RespondReviewDTO) {
    const review = respondReviewStep(input)

    const { data: linked } = useQueryGraphStep({
      entity: "review",
      fields: ["id", "reference", "product.id", "seller.id"],
      filters: { id: input.id },
    })

    const eventData = transform({ linked }, ({ linked }) =>
      buildReviewEventData(linked[0] as LinkedReview)
    )

    emitEventStep({
      eventName: ReviewWorkflowEvents.RESPONDED,
      data: eventData,
    })

    return new WorkflowResponse(review)
  }
)
