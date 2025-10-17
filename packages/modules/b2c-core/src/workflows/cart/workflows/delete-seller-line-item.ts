import {
  createWorkflow,
  parallelize,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  deleteLineItemsWorkflow,
  removeShippingMethodFromCartStep,
  useQueryGraphStep
} from '@medusajs/medusa/core-flows'

import sellerShippingOptionLink from '../../../links/seller-shipping-option'

type DeleteSellerLineItemWorkflowInput = {
  cart_id: string
  id: string
}

export const deleteSellerLineItemWorkflow = createWorkflow(
  'delete-seller-line-item',
  function (input: DeleteSellerLineItemWorkflowInput) {
    const { data: lineItems } = useQueryGraphStep({
      entity: 'line_item',
      fields: ['product.id', 'product.seller.id'],
      filters: {
        id: input.id
      },
      options: { throwIfKeyNotFound: true }
    }).config({ name: 'line-item-query' })

    const { data: carts } = useQueryGraphStep({
      entity: 'cart',
      fields: ['id', 'shipping_methods.shipping_option_id'],
      filters: { id: input.cart_id },
      options: { throwIfKeyNotFound: true }
    }).config({ name: 'cart-query' })

    const optionIds = transform(carts[0], ({ shipping_methods }) => {
      return shipping_methods.map((method) => method.shipping_option_id)
    })

    const { data: sellerShippingOptions } = useQueryGraphStep({
      entity: sellerShippingOptionLink.entryPoint,
      fields: ['seller_id', 'shipping_option_id'],
      filters: { shipping_option_id: optionIds }
    }).config({ name: 'seller-shipping-option-query' })

    const shippingMethodsToRemove = transform(
      { sellerShippingOptions, lineItem: lineItems[0], cart: carts[0] },
      ({ sellerShippingOptions, lineItem, cart }) => {
        const optionIdToRemove = sellerShippingOptions.find(
          (option) => option.seller_id === lineItem.product.seller.id
        )?.shipping_option_id

        if (!optionIdToRemove) {
          return []
        }

        const methodId = cart.shipping_methods.find(
          (method) => method.shipping_option_id === optionIdToRemove
        ).id

        return [methodId]
      }
    )

    parallelize(
      removeShippingMethodFromCartStep({
        shipping_method_ids: shippingMethodsToRemove
      }),
      deleteLineItemsWorkflow.runAsStep({
        input: {
          cart_id: input.cart_id,
          ids: [input.id]
        }
      })
    )
  }
)
