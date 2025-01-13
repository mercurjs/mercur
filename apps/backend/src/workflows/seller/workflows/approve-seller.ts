import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { SellerStatus } from '../../../modules/seller/types/common'
import { approveSellerStep } from '../steps'

export const approveSellerWorkflow = createWorkflow(
  'approve-seller',
  function (input: { id: string }) {
    return new WorkflowResponse(
      approveSellerStep({ id: input.id, status: SellerStatus.APPROVED })
    )
  }
)
