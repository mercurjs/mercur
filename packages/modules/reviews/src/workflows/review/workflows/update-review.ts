import {
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import { AlgoliaEvents, UpdateReviewDTO } from "@mercurjs/framework";

import { updateReviewStep } from "../steps";

export const updateReviewWorkflow = createWorkflow(
  {
    name: "update-review",
  },
  function (input: UpdateReviewDTO) {
    const review = updateReviewStep(input);
    emitEventStep({
      eventName: AlgoliaEvents.REVIEW_CHANGED,
      data: { review },
    });

    const reviewUpdatedHook = createHook("reviewUpdated", {
      review_id: review.id,
    });
    return new WorkflowResponse(review, {
      hooks: [reviewUpdatedHook],
    });
  }
);
