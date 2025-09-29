import { kebabCase } from '@medusajs/framework/utils'
import { createProductCategoriesWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { updateRequestWorkflow } from './update-request'

export const acceptProductCategoryRequestWorkflow = createWorkflow(
  'accept-product-category-request',
  function (input: AcceptRequestDTO) {
    const productCategory = createProductCategoriesWorkflow.runAsStep({
      input: {
        product_categories: [
          {
            ...input.data,
            handle:
              input.data.handle === ''
                ? kebabCase(input.data.name)
                : input.data.handle,
            is_active: true
          }
        ]
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(productCategory[0])
  }
)
