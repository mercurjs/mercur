import { CreateWishlistDTO } from '#/modules/wishlist/types/mutations'

import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { createWishlistStep } from '../steps'

export const createWishlistWorkflow = createWorkflow(
  {
    name: 'create-wishlist'
  },
  function (input: CreateWishlistDTO) {
    return new WorkflowResponse(createWishlistStep(input))
  }
)
