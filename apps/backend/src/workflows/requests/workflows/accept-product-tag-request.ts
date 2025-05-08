import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'
import { createProductTagsWorkflow } from '@medusajs/medusa/core-flows'

import { AcceptRequestDTO } from '../../../modules/requests/types'
import { updateRequestWorkflow } from './update-request'

export const acceptProductTagRequestWorkflow = createWorkflow(
  'accept-product-tag-request',
  function (input: AcceptRequestDTO) {
    const result = createProductTagsWorkflow.runAsStep({
      input: {
        product_tags: [input.data]
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(result[0])
  }
)
