import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptProductRequestDTO } from '../../../modules/requests/types'
import { updateRequestWorkflow } from './update-request'

export const acceptProductRequestWorkflow = createWorkflow(
  'accept-product-request',
  function (input: AcceptProductRequestDTO) {
    const product = createProductsWorkflow.runAsStep({
      input: {
        products: [{ ...input.data, status: 'published' }],
        additional_data: input.seller_id ? { seller_id: input.seller_id } : {}
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(product[0])
  }
)
