import { kebabCase } from '@medusajs/framework/utils'
import { createCollectionsWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { updateRequestWorkflow } from './update-request'

export const acceptProductCollectionRequestWorkflow = createWorkflow(
  'accept-product-collection-request',
  function (input: AcceptRequestDTO) {
    const collection = createCollectionsWorkflow.runAsStep({
      input: {
        collections: [
          {
            title: input.data.title,
            handle:
              input.data.handle === ''
                ? kebabCase(input.data.title)
                : input.data.handle
          }
        ],
        additional_data: input.data.details ? {
          details: input.data.details
        } : undefined
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(collection[0])
  }
)
