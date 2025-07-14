import { createWorkflow } from '@medusajs/workflows-sdk'

import { deleteMemberStep } from '../steps'

/**
 * Deletes member record from the system.
 */
export const deleteMemberWorkflow = createWorkflow(
  'delete-member',
  function (id: string) {
    deleteMemberStep(id)
  }
)
