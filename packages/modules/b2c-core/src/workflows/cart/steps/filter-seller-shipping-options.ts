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
      fields: [
        'items.product_id',
        'shipping_methods.shipping_option_id',
        'metadata'
      ],
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

    // Also check admin shipping options covering sellers via cart metadata
    const adminShippingSellerMap =
      (cart.metadata?.admin_shipping_seller_map as Record<string, string>) ?? {}

    const sellersFromAdminShipping = Object.keys(adminShippingSellerMap).filter(
      (sellerId) =>
        existingShippingOptions.includes(adminShippingSellerMap[sellerId])
    )

    const sellersToFindShippingOptions = arrayDifference(
      [...new Set(sellersInCart.map((s) => s.seller_id))],
      [
        ...new Set([
          ...sellersAlreadyCovered.map((s) => s.seller_id),
          ...sellersFromAdminShipping
        ])
      ]
    )

    const { data: sellerShippingOptions } = await query.graph({
      entity: sellerShippingOption.entryPoint,
      fields: ['shipping_option_id', 'seller.name', 'seller.id'],
      filters: {
        seller_id: sellersToFindShippingOptions
      }
    })

    const applicableSellerOptionIds = new Set(
      sellerShippingOptions.map((so) => so.shipping_option_id)
    )

    // Seller-linked options
    const sellerOptions = input.shipping_options
      .filter((option) => applicableSellerOptionIds.has(option.id))
      .map((option) => {
        const relation = sellerShippingOptions.find(
          (o) => o.shipping_option_id === option.id
        )
        return {
          ...option,
          seller_name: relation.seller.name,
          seller_id: relation.seller.id,
          is_admin_option: false
        }
      })

    // Admin options: options returned by Medusa core that are NOT linked to any seller
    const allLinkedOptionIds = new Set(
      sellerShippingOptions.map((so) => so.shipping_option_id)
    )

    // Query all seller-shipping-option links for all returned options to find which are admin
    const allReturnedOptionIds = input.shipping_options.map((o) => o.id)
    const { data: allLinkedOptions } = await query.graph({
      entity: sellerShippingOption.entryPoint,
      fields: ['shipping_option_id'],
      filters: {
        shipping_option_id: allReturnedOptionIds
      }
    })
    const allLinkedOptionIdsSet = new Set(
      allLinkedOptions.map((lo) => lo.shipping_option_id)
    )

    const hasUncoveredSellers = sellersToFindShippingOptions.length > 0

    const adminOptions = hasUncoveredSellers
      ? input.shipping_options
          .filter((option) => !allLinkedOptionIdsSet.has(option.id))
          .map((option) => ({
            ...option,
            seller_name: null,
            seller_id: null,
            is_admin_option: true
          }))
      : []

    return new StepResponse([...sellerOptions, ...adminOptions])
  }
)
