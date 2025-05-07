import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { DeleteWishlistDTO } from '../../../modules/wishlist/types/mutations'
import { deleteWishlistEntryStep } from '../steps'

export const deleteWishlistEntryWorkflow = createWorkflow(
  {
    name: 'delete-wishlist'
  },
  function (input: DeleteWishlistDTO) {
    return new WorkflowResponse(deleteWishlistEntryStep(input))
  }
)
