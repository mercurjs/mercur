import { Modules } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'

import { REVIEW_MODULE } from '../../../modules/reviews'
import { CreateReviewDTO } from '../../../modules/reviews/types'
import { SELLER_MODULE } from '../../../modules/seller'
import { createReviewStep } from '../steps'

export const createReviewWorkflow = createWorkflow(
  {
    name: 'create-review'
  },
  function (input: CreateReviewDTO) {
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
    return new WorkflowResponse(review)
  }
)
