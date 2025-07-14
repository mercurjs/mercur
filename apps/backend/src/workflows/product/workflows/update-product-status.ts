import { ProductStatus } from '@medusajs/framework/utils'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { updateProductStatusStep } from '../steps'

/**
 * Updates product status and returns the modified product.
 */
export const updateProductStatusWorkflow = createWorkflow(
  'update-product-status',
  function (input: { id: string; status: ProductStatus }) {
    return new WorkflowResponse(updateProductStatusStep(input))
  }
)
