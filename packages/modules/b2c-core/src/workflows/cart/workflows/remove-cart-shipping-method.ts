import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'
import { removeShippingMethodFromCartStep } from '@medusajs/medusa/core-flows'

type WorkflowData = {
  shipping_method_ids: string[]
}

export const removeCartShippingMethodsWorkflow = createWorkflow(
  'remove-cart-shipping-methods',
  function (input: WorkflowData) {
    return new WorkflowResponse(removeShippingMethodFromCartStep(input))
  }
)
