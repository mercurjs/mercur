import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'
import { createProductTypesWorkflow } from '@medusajs/medusa/core-flows'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { updateRequestWorkflow } from './update-request'

/**
 * Accepts product type request and creates the type.
 */
export const acceptProductTypeRequestWorkflow = createWorkflow(
  'accept-product-type-request',
  function (input: AcceptRequestDTO) {
    const result = createProductTypesWorkflow.runAsStep({
      input: {
        product_types: [input.data]
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(result[0])
  }
)
