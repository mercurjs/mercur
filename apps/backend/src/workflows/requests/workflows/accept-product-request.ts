import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '../../../modules/requests/types'
import { updateRequestWorkflow } from './update-request'

export const acceptProductRequestWorkflow = createWorkflow(
  'accept-product-request',
  function (input: AcceptRequestDTO) {
    const product = createProductsWorkflow.runAsStep({
      input: {
        products: [input.data]
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(product)
  }
)
