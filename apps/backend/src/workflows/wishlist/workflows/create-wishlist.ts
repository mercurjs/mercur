import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { CreateWishlistDTO } from '../../../modules/wishlist/types/mutations'
import { createWishlistEntryStep } from '../steps'

export const createWishlistEntryWorkflow = createWorkflow(
  {
    name: 'create-wishlist'
  },
  function (input: CreateWishlistDTO) {
    return new WorkflowResponse(createWishlistEntryStep(input))
  }
)
