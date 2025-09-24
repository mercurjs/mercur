import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { createSellerWorkflow } from '../../seller/workflows'
import { updateRequestWorkflow } from './update-request'

export const acceptSellerCreationRequestWorkflow = createWorkflow(
  'accept-seller-creation-request',
  function (input: AcceptRequestDTO) {
    const seller = createSellerWorkflow.runAsStep({
      input: {
        member: input.data.member,
        seller: input.data.seller,
        auth_identity_id: input.data.auth_identity_id
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(seller)
  }
)
