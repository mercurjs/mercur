import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { RespondReviewDTO } from "@mercurjs/types"

import { respondReviewStep } from "../steps"

export const respondReviewWorkflow = createWorkflow(
  {
    name: "respond-review",
  },
  function (input: RespondReviewDTO) {
    const review = respondReviewStep(input)

    return new WorkflowResponse(review)
  }
)
