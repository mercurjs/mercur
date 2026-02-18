import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";

import { deleteReviewStep } from "../steps";

export const deleteReviewWorkflow = createWorkflow(
  {
    name: "delete-review",
  },
  function (id: string) {
    deleteReviewStep(id);

    return new WorkflowResponse(id);
  }
);
