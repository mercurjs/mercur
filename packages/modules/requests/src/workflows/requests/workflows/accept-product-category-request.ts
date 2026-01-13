import { createProductCategoriesWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow, transform } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { updateRequestWorkflow } from './update-request'
import { createHandleFromNameStep } from '../steps/create-handle-from-name'

export const acceptProductCategoryRequestWorkflow = createWorkflow(
  'accept-product-category-request',
  function (input: AcceptRequestDTO) {

    const handle = createHandleFromNameStep(input)

    const categoryData = transform({ input, handle }, ({ input, handle }) => ({
      ...input.data,
      handle,
      is_active: true
    }))

    const productCategory = createProductCategoriesWorkflow.runAsStep({
      input: {
        product_categories: [categoryData]
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(productCategory[0])
  }
)
