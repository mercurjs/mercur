import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";

import { UpdateReviewDTO } from "../../../modules/reviews";
import { updateReviewStep } from "../steps";

export const updateReviewWorkflow = createWorkflow(
  {
    name: "update-review",
  },
  function (input: UpdateReviewDTO) {
    const review = updateReviewStep(input);

    return new WorkflowResponse(review);
  }
);
