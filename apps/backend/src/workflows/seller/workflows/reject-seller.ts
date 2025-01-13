import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { SellerStatus } from '../../../modules/seller/types/common'
import { rejectSellerStep } from '../steps'

export const rejectSellerWorkflow = createWorkflow(
  'reject-seller',
  function (input: { id: string }) {
    return new WorkflowResponse(
      rejectSellerStep({ id: input.id, status: SellerStatus.REJECTED })
    )

    /**
     * TODO:
     * Added email notification after sucessul workflow execution
     */
  }
)
