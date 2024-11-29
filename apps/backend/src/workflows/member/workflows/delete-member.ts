import { createWorkflow } from '@medusajs/workflows-sdk'

import { deleteMemberStep } from '../steps'

export const deleteMemberWorkflow = createWorkflow(
  'delete-member',
  function (id: string) {
    deleteMemberStep(id)
  }
)
