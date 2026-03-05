import { CartShippingMethodDTO } from '@medusajs/framework/types'
import { createWorkflow, transform, when } from '@medusajs/framework/workflows-sdk'
import {
  addShippingMethodToCartStep,
  addShippingMethodToCartWorkflow,
  updateCartsStep,
  useQueryGraphStep
} from '@medusajs/medusa/core-flows'

import sellerShippingOptionLink from '../../../links/seller-shipping-option'
import { validateCartShippingOptionsStep } from '../steps'

type AddSellerShippingMethodToCartWorkflowInput = {
  cart_id: string
  option: {
    id: string
    data?: Record<string, any>
  }
  seller_id?: string
}

export const addSellerShippingMethodToCartWorkflow = createWorkflow(
  'add-seller-shipping-method-to-cart',
  function (input: AddSellerShippingMethodToCartWorkflowInput) {
    const { data: carts } = useQueryGraphStep({
      entity: 'cart',
      filters: {
        id: input.cart_id
      },
      fields: ['id', 'shipping_methods.*', 'metadata'],
      options: { throwIfKeyNotFound: true }
    }).config({ name: 'cart-query' })

    const validateCartShippingOptionsInput = transform(
      { carts, option: input.option },
      ({ carts: [cart], option }) => ({
        cart_id: cart.id,
        option_ids: [
          ...cart.shipping_methods.map((method) => method.shipping_option_id),
          option.id
        ]
      })
    )

    validateCartShippingOptionsStep(validateCartShippingOptionsInput)

    const addShippingMethodToCartInput = transform(
      input,
      ({ cart_id, option }) => ({
        cart_id,
        options: [option]
      })
    )

    // default addShippingMethodToCartWorkflow will replace all existing shippings methods in the cart
    addShippingMethodToCartWorkflow.runAsStep({
      input: addShippingMethodToCartInput
    })

    const shippingOptions = transform(
      { carts, newShippingOption: input.option },
      ({ carts: [cart], newShippingOption }) => {
        return [
          ...cart.shipping_methods.map((sm) => sm.shipping_option_id),
          newShippingOption.id
        ]
      }
    )

    const { data: sellerShippingOptions } = useQueryGraphStep({
      entity: sellerShippingOptionLink.entryPoint,
      fields: ['shipping_option.*', 'seller_id'],
      filters: {
        shipping_option_id: shippingOptions
      }
    }).config({ name: 'seller-shipping-option-query' })

    const shippingMethodsToAddInput = transform(
      {
        carts,
        sellerShippingOptions,
        newShippingOption: input.option,
        inputSellerId: input.seller_id
      },
      ({
        carts: [cart],
        sellerShippingOptions,
        newShippingOption,
        inputSellerId
      }) => {
        const shippingOptionToSellerMap = new Map(
          sellerShippingOptions.map((option) => [
            option.shipping_option.id,
            option.seller_id
          ])
        )

        // For admin options, supplement the map with the admin-seller mapping from cart metadata
        const adminShippingSellerMap =
          (cart.metadata?.admin_shipping_seller_map as Record<
            string,
            string
          >) ?? {}

        for (const [sellerId, optionId] of Object.entries(
          adminShippingSellerMap
        )) {
          if (!shippingOptionToSellerMap.has(optionId)) {
            shippingOptionToSellerMap.set(optionId, sellerId)
          }
        }

        const existingShippingMethodsBySeller = new Map<
          string,
          CartShippingMethodDTO
        >()

        for (const method of cart.shipping_methods) {
          const sellerId = shippingOptionToSellerMap.get(
            method.shipping_option_id
          )
          if (sellerId) {
            existingShippingMethodsBySeller.set(sellerId, method)
          }
        }

        // For admin options, use the provided seller_id; for seller options, look up from link
        const newOptionSellerId =
          shippingOptionToSellerMap.get(newShippingOption.id) ?? inputSellerId

        // Remove any existing shipping method for the same seller
        // since we're replacing it with the new option
        if (newOptionSellerId && existingShippingMethodsBySeller.has(newOptionSellerId)) {
          existingShippingMethodsBySeller.delete(newOptionSellerId)
        }

        return Array.from(existingShippingMethodsBySeller.values()).map(
          (method) => ({
            shipping_option_id: method.shipping_option_id,
            cart_id: cart.id,
            name: method.name,
            data: method.data,
            amount: method.amount,
            is_tax_inclusive: method.is_tax_inclusive
          })
        )
      }
    )

    addShippingMethodToCartStep({
      shipping_methods: shippingMethodsToAddInput
    })

    // If this is an admin option (seller_id provided), persist the mapping in cart metadata
    when({ inputSellerId: input.seller_id }, ({ inputSellerId }) => {
      return !!inputSellerId
    }).then(() => {
      const updateCartMetadataInput = transform(
        {
          carts,
          inputSellerId: input.seller_id,
          newShippingOption: input.option
        },
        ({ carts: [cart], inputSellerId, newShippingOption }) => {
          const existingMap =
            (cart.metadata?.admin_shipping_seller_map as Record<
              string,
              string
            >) ?? {}

          return [
            {
              id: cart.id,
              metadata: {
                ...cart.metadata,
                admin_shipping_seller_map: {
                  ...existingMap,
                  [inputSellerId!]: newShippingOption.id
                }
              }
            }
          ]
        }
      )

      updateCartsStep(updateCartMetadataInput)
    })
  }
)
