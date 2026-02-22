import {
  listShippingOptionsForCartWorkflow,
  useQueryGraphStep
} from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

export const listSellerReturnShippingOptionsForOrderWorkflow = createWorkflow(
  'list-seller-return-shipping-options-for-order',
  function ({ order_id }: { order_id: string }) {
    const orderQuery = useQueryGraphStep({
      entity: 'order',
      fields: ['order_set.cart_id', 'seller.shipping_options.id'],
      filters: {
        id: order_id
      },
      options: { throwIfKeyNotFound: true }
    })

    const stepInput = transform({ orderQuery }, ({ orderQuery }) => {
      const transformed = orderQuery.data[0]

      return {
        cart_id: transformed.order_set.cart_id,
        is_return: true,
        option_ids: transformed.seller.shipping_options.map(
          (option) => option.id
        )
      }
    })

    return new WorkflowResponse(
      listShippingOptionsForCartWorkflow.runAsStep({
        input: stepInput
      })
    )
  }
)
