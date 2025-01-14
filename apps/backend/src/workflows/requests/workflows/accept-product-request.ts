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
    const createProductPayload = transform({ input }, ({ input }) => {
      const payload = {
        products: [input.data]
      }
      return input.seller_id
        ? { ...payload, additional_data: { seller_id: input.seller_id } }
        : payload
    })

    const product = createProductsWorkflow.runAsStep({
      input: createProductPayload
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(product)
  }
)
