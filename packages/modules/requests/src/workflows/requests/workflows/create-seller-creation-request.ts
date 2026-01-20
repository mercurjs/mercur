import {
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/workflows-sdk";

import {
  CreateRequestDTO,
  RequestUpdated,
  SellerRequest,
  emitMultipleEventsStep,
} from "@mercurjs/framework";

import { createRequestStep } from "../steps";

export const createSellerCreationRequestWorkflow = createWorkflow(
  "create-seller-creation-request",
  function (input: CreateRequestDTO) {
    const request = createRequestStep(input);

    emitMultipleEventsStep([
      {
        name: SellerRequest.CREATED,
        data: input,
      },
      {
        name: RequestUpdated.CREATED,
        data: input,
      },
    ]);

    const sellerCreationRequestCreatedHook = createHook(
      "sellerCreationRequestCreated",
      {
        requestId: request[0].id,
      }
    );
    return new WorkflowResponse(request, {
      hooks: [sellerCreationRequestCreatedHook],
    });
  }
);
