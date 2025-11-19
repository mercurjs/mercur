import { updateCollectionsWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { updateRequestWorkflow } from './update-request'

export const acceptProductCollectionUpdateRequestWorkflow = createWorkflow(
  'accept-product-collection-update-request',
  function (input: AcceptRequestDTO) {
    const { collection_id, ...updateData } = input.data

    const collection = updateCollectionsWorkflow.runAsStep({
      input: {
        selector: { id: collection_id },
        update: updateData
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(collection[0])
  }
)

