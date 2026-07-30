import { Modules } from "@medusajs/framework/utils"
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { CreateReviewDTO, MercurModules } from "@mercurjs/types"

import { createReviewStep, validateReviewStep } from "../steps"

export const createReviewWorkflow = createWorkflow(
  {
    name: "create-review",
  },
  function (input: CreateReviewDTO) {
    validateReviewStep(input)
    const review = createReviewStep(input)

    const link = transform({ input, review }, ({ input, review }) => {
      return input.reference === "product"
        ? [
            {
              [Modules.PRODUCT]: {
                product_id: input.reference_id,
              },
              [MercurModules.REVIEW]: {
                review_id: review.id,
              },
            },
          ]
        : [
            {
              [MercurModules.SELLER]: {
                seller_id: input.reference_id,
              },
              [MercurModules.REVIEW]: {
                review_id: review.id,
              },
            },
          ]
    })

    createRemoteLinkStep(link)

    return new WorkflowResponse(review)
  }
)
