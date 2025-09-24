import { ShippingOptionDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  arrayDifference
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'
import sellerShippingOption from '../../../links/seller-shipping-option'

export const filterSellerShippingOptionsStep = createStep(
  'filter-seller-shipping-options',
  async (
    input: { shipping_options: ShippingOptionDTO[]; cart_id: string },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [cart]
    } = await query.graph({
      entity: 'cart',
      fields: ['items.product_id', 'shipping_methods.shipping_option_id'],
      filters: {
        id: input.cart_id
      }
    })

    const { data: sellersInCart } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['seller_id'],
      filters: {
        product_id: cart.items.map((i) => i.product_id)
      }
    })

    const existingShippingOptions = cart.shipping_methods.map(
      (sm) => sm.shipping_option_id
    )

    const { data: sellersAlreadyCovered } = await query.graph({
      entity: sellerShippingOption.entryPoint,
      fields: ['seller_id'],
      filters: {
        shipping_option_id: existingShippingOptions
      }
    })

    const sellersToFindShippingOptions = arrayDifference(
      [...new Set(sellersInCart.map((s) => s.seller_id))],
      [...new Set(sellersAlreadyCovered.map((s) => s.seller_id))]
    )

    const { data: sellerShippingOptions } = await query.graph({
      entity: sellerShippingOption.entryPoint,
      fields: ['shipping_option_id', 'seller.name', 'seller.id'],
      filters: {
        seller_id: sellersToFindShippingOptions
      }
    })

    const applicableShippingOptions = sellerShippingOptions.map(
      (so) => so.shipping_option_id
    )

    const optionsAvailable = input.shipping_options
      .filter((option) => applicableShippingOptions.includes(option.id))
      .map((option) => {
        const relation = sellerShippingOptions.find(
          (o) => o.shipping_option_id === option.id
        )
        return {
          ...option,
          seller_name: relation.seller.name,
          seller_id: relation.seller.id
        }
      })
    return new StepResponse(optionsAvailable)
  }
)
