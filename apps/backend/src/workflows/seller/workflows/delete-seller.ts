import { createWorkflow } from '@medusajs/workflows-sdk'

import { deleteSellerStep } from '../steps'

/**
 * Deletes a seller record from the system.
 */
export const deleteSellerWorkflow = createWorkflow(
  'delete-seller',
  function (id: string) {
    deleteSellerStep(id)
  }
)
