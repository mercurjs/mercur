import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk";

import {
  CreateRequestDTO,
  ProductRequestUpdatedEvent,
  emitMultipleEventsStep,
  SELLER_MODULE,
} from "@mercurjs/framework";
import { REQUESTS_MODULE } from "../../../modules/requests";

import { createRequestStep } from "../../requests/steps";

export const importSellerProductsRequestWorkflow = createWorkflow(
  "import-seller-products-request",
  function ({
    seller_id,
    request_payloads,
  }: {
    seller_id: string;
    request_payloads: CreateRequestDTO[];
  }) {
    const requests = createRequestStep(request_payloads);

    const link = transform(
      { requests, seller_id },
      ({ requests, seller_id }) => {
        return requests.map(({ id }) => ({
          [SELLER_MODULE]: {
            seller_id,
          },
          [REQUESTS_MODULE]: {
            request_id: id,
          },
        }));
      }
    );

    const events = transform(requests, (requests) => {
      return requests.map(({ id }) => ({
        name: ProductRequestUpdatedEvent.CREATED,
        data: { id },
      }));
    });

    createRemoteLinkStep(link);
    emitMultipleEventsStep(events);

    return new WorkflowResponse(requests);
  }
);
