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

    // Get all seller IDs that have shipping options linked
    const allSellerIdsWithShippingOptions = new Set(
      sellerShippingOptions.map((so) => so.seller_id)
    )

    // Check if cart has products without sellers (admin products)
    const allProductSellerIds = new Set(sellersInCart.map((s) => s.seller_id))
    const hasAdminProducts = cart.items.some(
      (item) => !sellersInCart.some((sp) => sp.product_id === item.product_id)
    )

    // Get global shipping options (not linked to any seller) if cart has admin products
    let globalShippingOptions: string[] = []
    if (hasAdminProducts) {
      // Get all shipping option IDs that are linked to sellers
      const sellerLinkedOptionIds = new Set(
        sellerShippingOptions.map((so) => so.shipping_option_id)
      )

      // Global options are those not linked to any seller
      globalShippingOptions = input.shipping_options
        .filter((option) => !sellerLinkedOptionIds.has(option.id))
        .map((option) => option.id)
    }

    // Combine seller-specific and global shipping options
    const allApplicableOptionIds = [
      ...applicableShippingOptions,
      ...globalShippingOptions
    ]

    const optionsAvailable = input.shipping_options
      .filter((option) => allApplicableOptionIds.includes(option.id))
      .map((option) => {
        const relation = sellerShippingOptions.find(
          (o) => o.shipping_option_id === option.id
        )
        return {
          ...option,
          seller_name: relation?.seller?.name ?? null,
          seller_id: relation?.seller?.id ?? null,
          is_global: !relation
        }
      })
    return new StepResponse(optionsAvailable)
  }
)
