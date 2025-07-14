import { createWorkflow } from '@medusajs/workflows-sdk'

import { deleteMemberInvitesStep } from '../steps'

/**
 * Deletes member invitation from the system.
 */
export const deleteMemberInvitesWorkflow = createWorkflow(
  'delete-member-invite',
  function (id: string) {
    deleteMemberInvitesStep(id)
  }
)
