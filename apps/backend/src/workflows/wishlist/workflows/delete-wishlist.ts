import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { DeleteWishlistDTO } from '@mercurjs/framework'

import { deleteWishlistEntryStep } from '../steps'

/**
 * Deletes wishlist entry and returns the deleted entry.
 */
export const deleteWishlistEntryWorkflow = createWorkflow(
  {
    name: 'delete-wishlist'
  },
  function (input: DeleteWishlistDTO) {
    return new WorkflowResponse(deleteWishlistEntryStep(input))
  }
)
