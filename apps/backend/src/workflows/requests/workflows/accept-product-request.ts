import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { AcceptProductRequestDTO } from '../../../modules/requests/types'
import { updateRequestWorkflow } from './update-request'

export const acceptProductRequestWorkflow = createWorkflow(
  'accept-product-request',
  function (input: AcceptProductRequestDTO) {
    const productPayload = transform(input, (input) => ({
      ...input.data,
      status: 'published'
    }))

    const product = createProductsWorkflow.runAsStep({
      input: {
        products: [productPayload],
        additional_data: input.seller_id ? { seller_id: input.seller_id } : {}
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(product[0])
  }
)
