import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"

import { RespondReviewDTO } from "../../../modules/review"
import { updateReviewStep, validateReviewResponseStep } from "../steps"

export const respondReviewWorkflow = createWorkflow(
  {
    name: "respond-review",
  },
  function (input: RespondReviewDTO) {
    validateReviewResponseStep(input.id)

    const update = transform({ input }, ({ input }) => ({
      id: input.id,
      seller_note: input.seller_note,
    }))

    const review = updateReviewStep(update)

    return new WorkflowResponse(review)
  }
)
