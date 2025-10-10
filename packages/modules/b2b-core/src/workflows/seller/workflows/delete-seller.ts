import { createWorkflow } from '@medusajs/workflows-sdk'

import { deleteSellerStep } from '../steps'

export const deleteSellerWorkflow = createWorkflow(
  'delete-seller',
  function (id: string) {
    deleteSellerStep(id)
  }
)
