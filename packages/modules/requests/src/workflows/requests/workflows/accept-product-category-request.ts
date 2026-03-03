import { createProductCategoriesWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow, transform } from '@medusajs/workflows-sdk'

import { AcceptRequestDTO } from '@mercurjs/framework'

import { updateRequestWorkflow } from './update-request'
import { createHandleFromNameStep } from '../steps/create-handle-from-name'

export const acceptProductCategoryRequestWorkflow = createWorkflow(
  'accept-product-category-request',
  function (input: AcceptRequestDTO) {

    const handle = createHandleFromNameStep(input)

    const categoryData = transform({ input, handle }, ({ input, handle }) => {
      const { details: _details, ...rest } = input.data
      return {
        ...rest,
        handle,
        is_active: true
      }
    })

    const additionalData = transform({ input }, ({ input }) =>
      input.data.details ? { details: input.data.details } : undefined
    )

    const productCategory = createProductCategoriesWorkflow.runAsStep({
      input: {
        product_categories: [categoryData],
        additional_data: additionalData
      }
    })

    updateRequestWorkflow.runAsStep({ input })
    return new WorkflowResponse(productCategory[0])
  }
)
