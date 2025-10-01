import {
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";

import { deleteReviewStep } from "../steps";

export const deleteReviewWorkflow = createWorkflow(
  {
    name: "delete-review",
  },
  function (id: string) {
    deleteReviewStep(id);

    const reviewDeletedHook = createHook("reviewDeleted", {
      review_id: id,
    });
    return new WorkflowResponse(id, {
      hooks: [reviewDeletedHook],
    });
  }
);
