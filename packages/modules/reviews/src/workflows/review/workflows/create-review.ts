import { Modules } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows";

import { AlgoliaEvents, CreateReviewDTO } from "@mercurjs/framework";
import { REVIEW_MODULE } from "../../../modules/reviews";
const SELLER_MODULE = "seller";

import { createReviewStep, validateReviewStep } from "../steps";

export const createReviewWorkflow = createWorkflow(
  {
    name: "create-review",
  },
  function (input: CreateReviewDTO) {
    validateReviewStep(input);
    const review = createReviewStep(input);

    const link = transform({ input, review }, ({ input, review }) => {
      return input.reference === "product"
        ? [
            {
              [Modules.PRODUCT]: {
                product_id: input.reference_id,
              },
              [REVIEW_MODULE]: {
                review_id: review.id,
              },
            },
          ]
        : [
            {
              [SELLER_MODULE]: {
                seller_id: input.reference_id,
              },
              [REVIEW_MODULE]: {
                review_id: review.id,
              },
            },
          ];
    });

    createRemoteLinkStep(link);
    emitEventStep({
      eventName: AlgoliaEvents.REVIEW_CHANGED,
      data: { review },
    });

    const reviewCreatedHook = createHook("reviewCreated", {
      review_id: review.id,
    });
    return new WorkflowResponse(review, {
      hooks: [reviewCreatedHook],
    });
  }
);
