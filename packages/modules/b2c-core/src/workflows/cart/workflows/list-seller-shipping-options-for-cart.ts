import { listShippingOptionsForCartWorkflow } from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { filterSellerShippingOptionsStep } from '../steps'

export const listSellerShippingOptionsForCartWorkflow = createWorkflow(
  'list-seller-shipping-options-for-cart',
  function (input: { cart_id: string; is_return: boolean }) {
    const shipping_options = listShippingOptionsForCartWorkflow.runAsStep({
      input
    })

    const filterPayload = transform(
      { shipping_options, input },
      ({ shipping_options, input }) => ({
        shipping_options,
        cart_id: input.cart_id
      })
    )
    return new WorkflowResponse(filterSellerShippingOptionsStep(filterPayload))
  }
)
