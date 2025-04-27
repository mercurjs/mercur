import { DeleteWishlistDTO } from '#/modules/wishlist/types/mutations'

import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { deleteWishlistStep } from '../steps'

export const deleteWishlistWorkflow = createWorkflow(
  {
    name: 'delete-wishlist'
  },
  function (input: DeleteWishlistDTO) {
    return new WorkflowResponse(deleteWishlistStep(input))
  }
)
