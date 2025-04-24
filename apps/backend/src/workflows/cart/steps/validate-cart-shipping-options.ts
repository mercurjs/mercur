import {
  ContainerRegistrationKeys,
  MedusaError,
  promiseAll
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import sellerProductLink from '../../../links/seller-product'
import sellerShippingOptionLink from '../../../links/seller-shipping-option'

type ValidateCartShippingOptionsInput = {
  cart_id: string
  option_ids: string[]
}

export const validateCartShippingOptionsStep = createStep(
  'validate-cart-shipping-options',
  async (input: ValidateCartShippingOptionsInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    if (input.option_ids.length !== new Set(input.option_ids).size) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Some of the shipping methods are doubled!'
      )
    }

    const {
      data: [cart]
    } = await query.graph({
      entity: 'cart',
      fields: ['id', 'items.product_id'],
      filters: { id: input.cart_id }
    })

    const [{ data: sellerProducts }, { data: sellerShippingOptions }] =
      await promiseAll([
        query.graph({
          entity: sellerProductLink.entryPoint,
          fields: ['seller_id', 'product_id'],
          filters: {
            product_id: cart.items.map((item) => item.product_id)
          }
        }),
        query.graph({
          entity: sellerShippingOptionLink.entryPoint,
          fields: ['seller_id', 'shipping_option_id'],
          filters: {
            shipping_option_id: input.option_ids
          }
        })
      ])

    const sellers = new Set(sellerProducts.map((sp) => sp.seller_id))

    for (const sellerShippingOption of sellerShippingOptions) {
      if (!sellers.has(sellerShippingOption.seller_id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Shipping option with id: ${sellerShippingOption.shipping_option_id} is not available for any of the cart items`
        )
      }
    }

    return new StepResponse({
      sellerProducts,
      sellerShippingOptions
    })
  }
)
