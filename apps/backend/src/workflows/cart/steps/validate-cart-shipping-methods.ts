import sellerProductLink from '#/links/seller-product'
import sellerShippingOptionLink from '#/links/seller-shipping-option'

import { CartDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError,
  promiseAll
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

type ValidateCartShippingMethodsInput = {
  cart: CartDTO
}

export const validateCartShippingMethodsStep = createStep(
  'validate-cart-shipping-methods',
  async (input: ValidateCartShippingMethodsInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const [{ data: sellerProducts }, { data: sellerShippingOptions }] =
      await promiseAll([
        query.graph({
          entity: sellerProductLink.entryPoint,
          fields: ['seller_id', 'product_id'],
          filters: {
            product_id: input.cart.items!.map((item) => item.product_id)
          }
        }),
        query.graph({
          entity: sellerShippingOptionLink.entryPoint,
          fields: ['seller_id', 'shipping_option_id'],
          filters: {
            shipping_option_id: input.cart.shipping_methods!.map(
              (sm) => sm.shipping_option_id
            )
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

    if (sellers.size !== sellerShippingOptions.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Every seller must have a single shipping option'
      )
    }

    return new StepResponse({
      sellerProducts,
      sellerShippingOptions
    })
  }
)
