import { createProductCategoriesWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '../../../modules/requests/types'
import { updateRequestWorkflow } from './update-request'

export const acceptProductCategoryRequestWorkflow = createWorkflow(
  'accept-product-category-request',
  function (input: AcceptRequestDTO) {
    const productCategory = createProductCategoriesWorkflow.runAsStep({
      input: {
        product_categories: [input.data]
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(productCategory[0])
  }
)
