import { Modules } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  createRemoteLinkStep,
  emitEventStep
} from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '../../../modules/algolia/types'
import { REVIEW_MODULE } from '../../../modules/reviews'
import { CreateReviewDTO } from '../../../modules/reviews/types'
import { SELLER_MODULE } from '../../../modules/seller'
import { createReviewStep, validateReviewStep } from '../steps'

export const createReviewWorkflow = createWorkflow(
  {
    name: 'create-review'
  },
  function (input: CreateReviewDTO) {
    validateReviewStep(input)
    const review = createReviewStep(input)

    const link = transform({ input, review }, ({ input, review }) => {
      return input.reference === 'product'
        ? [
            {
              [Modules.PRODUCT]: {
                product_id: input.reference_id
              },
              [REVIEW_MODULE]: {
                review_id: review.id
              }
            }
          ]
        : [
            {
              [SELLER_MODULE]: {
                seller_id: input.reference_id
              },
              [REVIEW_MODULE]: {
                review_id: review.id
              }
            }
          ]
    })

    createRemoteLinkStep(link)
    emitEventStep({
      eventName: AlgoliaEvents.REVIEW_CHANGED,
      data: { review }
    })
    return new WorkflowResponse(review)
  }
)
