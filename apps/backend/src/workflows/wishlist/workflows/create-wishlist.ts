import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { CreateWishlistDTO } from '@mercurjs/framework'

import { createWishlistEntryStep } from '../steps'

/**
 * Creates wishlist entry and returns the created entry.
 */
export const createWishlistEntryWorkflow = createWorkflow(
  {
    name: 'create-wishlist'
  },
  function (input: CreateWishlistDTO) {
    return new WorkflowResponse(createWishlistEntryStep(input))
  }
)
