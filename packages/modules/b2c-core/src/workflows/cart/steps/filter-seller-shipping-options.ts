import { ShippingOptionDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  arrayDifference
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { intersectSets } from '@mercurjs/framework'

import sellerProduct from '../../../links/seller-product'
import sellerShippingOption from '../../../links/seller-shipping-option'
import {
  getShippingOptionsFromLocation,
  getStockLocationsFromItem
} from '../utils'

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
        'items.id',
        'items.product_id',
        'items.variant.inventory_items.inventory.location_levels.stock_locations.id',
        'items.variant.inventory_items.inventory.location_levels.stock_locations.fulfillment_sets.service_zones.shipping_options.id',
        'shipping_methods.shipping_option_id'
      ],
      filters: {
        id: input.cart_id
      }
    })

    const { data: sellersInCart } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['seller_id', 'product_id'],
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

    const productIdToSellerId = new Map<string, string>()
    for (const relation of sellersInCart) {
      productIdToSellerId.set(relation.product_id, relation.seller_id)
    }

    const stockLocationIdToOptionIds = new Map<string, Set<string>>()

    const sellerIdToItemLocationSets = new Map<string, Set<string>[]>()

    cart.items.forEach((item, index) => {
      const sellerId = productIdToSellerId.get(item.product_id)
      if (!sellerId || !sellersToFindShippingOptions.includes(sellerId)) {
        return
      }

      const locationIdsForItem = new Set<string>()
      const stockLocationsForItem = getStockLocationsFromItem(item)

      stockLocationsForItem.forEach((stockLocation) => {
        locationIdsForItem.add(stockLocation.id)

        if (!stockLocationIdToOptionIds.has(stockLocation.id)) {
          stockLocationIdToOptionIds.set(
            stockLocation.id,
            new Set(getShippingOptionsFromLocation(stockLocation))
          )
        }
      })

      if (!sellerIdToItemLocationSets.has(sellerId)) {
        sellerIdToItemLocationSets.set(sellerId, [])
      }
      sellerIdToItemLocationSets.get(sellerId)!.push(locationIdsForItem)
    })

    const sellerIdToCommonLocationIds = new Map<string, Set<string>>()
    for (const [sellerId, locationSets] of sellerIdToItemLocationSets) {
      sellerIdToCommonLocationIds.set(sellerId, intersectSets(locationSets))
    }

    const sellerIdToValidOptionIds = new Map<string, Set<string>>()
    for (const [sellerId, commonLocationIds] of sellerIdToCommonLocationIds) {
      const validOptionIds = new Set<string>()
      commonLocationIds.forEach((locationId) => {
        stockLocationIdToOptionIds.get(locationId)?.forEach((id) => validOptionIds.add(id))
      })
      sellerIdToValidOptionIds.set(sellerId, validOptionIds)
    }

    const applicableShippingOptions = sellerShippingOptions.filter((relation) => {
      const sellerId = relation.seller.id
      const validOptionIds = sellerIdToValidOptionIds.get(sellerId)
      if (!validOptionIds || !validOptionIds.has(relation.shipping_option_id)) {
        return false
      }

      const optionFromInput = input.shipping_options.find(
        (opt) => opt.id === relation.shipping_option_id
      )
      const optionLocationId =
        (optionFromInput as any)?.service_zone?.fulfillment_set?.location?.id
      const commonLocationIds = sellerIdToCommonLocationIds.get(sellerId)

      return (
        !optionLocationId ||
        (commonLocationIds && commonLocationIds.has(optionLocationId))
      )
    })

    const optionsAvailable = input.shipping_options
      .filter((option) =>
        applicableShippingOptions.some((so) => so.shipping_option_id === option.id)
      )
      .map((option) => {
        const relation = applicableShippingOptions.find(
          (o) => o.shipping_option_id === option.id
        )
        return {
          ...option,
          seller_name: relation!.seller.name,
          seller_id: relation!.seller.id
        }
      })

    return new StepResponse(optionsAvailable)
  }
)