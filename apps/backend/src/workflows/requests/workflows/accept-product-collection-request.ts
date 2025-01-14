import { createCollectionsWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '../../../modules/requests/types'
import { updateRequestWorkflow } from './update-request'

export const acceptProductCollectionRequestWorkflow = createWorkflow(
  'accept-product-collection-request',
  function (input: AcceptRequestDTO) {
    const collection = createCollectionsWorkflow.runAsStep({
      input: { collections: [input.data] }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(collection[0])
  }
)
