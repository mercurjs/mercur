import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk";

import {
  CreateRequestDTO,
  ProductRequestUpdatedEvent,
  RequestUpdated,
  SELLER_MODULE,
  emitMultipleEventsStep,
} from "@mercurjs/framework";
import { REQUESTS_MODULE } from "../../../modules/requests";

import { createRequestStep } from "../steps";

export const createProductRequestWorkflow = createWorkflow(
  "create-product-request",
  function ({
    data,
    seller_id,
  }: {
    data: CreateRequestDTO;
    seller_id: string;
    additional_data?: any;
  }) {
    const request = createRequestStep(data);

    const link = transform({ request, seller_id }, ({ request, seller_id }) => {
      return [
        {
          [SELLER_MODULE]: {
            seller_id,
          },
          [REQUESTS_MODULE]: {
            request_id: request[0].id,
          },
        },
      ];
    });

    createRemoteLinkStep(link);

    emitMultipleEventsStep([
      {
        name: RequestUpdated.CREATED,
        data: { ...data, sellerId: seller_id },
      },
      {
        name: ProductRequestUpdatedEvent.CREATED,
        data: { id: request[0].id },
      },
    ]);

    const productRequestCreatedHook = createHook("productRequestCreated", {
      requestId: request[0].id,
      sellerId: seller_id,
    });
    return new WorkflowResponse(request, {
      hooks: [productRequestCreatedHook],
    });
  }
);
