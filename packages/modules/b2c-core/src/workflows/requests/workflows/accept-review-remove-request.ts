import { WorkflowResponse, createWorkflow } from "@medusajs/workflows-sdk";

import {
  AcceptRequestDTO,
  RemoveReviewRequestUpdatedEvent,
} from "@mercurjs/framework";

import { updateRequestWorkflow } from "./update-request";
import { emitEventStep } from "@medusajs/medusa/core-flows";

export const acceptReviewRemoveRequestWorkflow = createWorkflow(
  "accept-review-remove-request",
  function (input: AcceptRequestDTO) {
    emitEventStep({
      eventName: RemoveReviewRequestUpdatedEvent.REMOVED,
      data: {
        id: input.data.review_id,
      },
    });
    updateRequestWorkflow.runAsStep({ input });
    return new WorkflowResponse(true);
  }
);
