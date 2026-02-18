import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import { UpdateReviewDTO, ReviewEvents } from "../../../modules/reviews";
import { updateReviewStep } from "../steps";

export const updateReviewWorkflow = createWorkflow(
  {
    name: "update-review",
  },
  function (input: UpdateReviewDTO) {
    const review = updateReviewStep(input);
    emitEventStep({
      eventName: ReviewEvents.REVIEW_CHANGED,
      data: { review },
    });

    return new WorkflowResponse(review);
  }
);
