import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { updateRequestWorkflow } from './update-request'

export const acceptProductRequestWorkflow = createWorkflow(
  'accept-product-request',
  function (input: AcceptRequestDTO) {
    const product = updateProductsWorkflow.runAsStep({
      input: {
        selector: { id: input.data.product_id },
        update: { status: 'published' }
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(product)
  }
)
