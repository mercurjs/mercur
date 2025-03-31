import { fakerPL as faker } from '@faker-js/faker'

import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  addShippingMethodToCartWorkflow,
  addToCartWorkflow,
  createCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow
} from '@medusajs/medusa/core-flows'

import sellerProduct from '../../../links/seller-product'
import sellerShippingOption from '../../../links/seller-shipping-option'
import { CreateQuickOrderType } from './validators'

export async function createPayments(
  cart_id: string,
  container: MedusaContainer
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  await createPaymentCollectionForCartWorkflow.run({
    container,
    input: {
      cart_id
    }
  })

  const {
    data: [payment_collection]
  } = await query.graph({
    entity: 'cart_payment_collection',
    fields: ['payment_collection_id'],
    filters: {
      cart_id
    }
  })

  await createPaymentSessionsWorkflow.run({
    container,
    input: {
      payment_collection_id: payment_collection.payment_collection_id,
      provider_id: 'pp_system_default'
    }
  })
}

export async function createCart(
  input: CreateQuickOrderType,
  container: MedusaContainer
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const address = {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    province: faker.location.state(),
    address_1: faker.location.streetAddress(),
    address_2: faker.location.secondaryAddress(),
    country_code: 'pl'
  }

  const {
    data: [sales_channel]
  } = await query.graph({
    entity: 'sales_channel',
    fields: ['id']
  })

  const { result: cart } = await createCartWorkflow.run({
    container,
    input: {
      billing_address: address,
      shipping_address: address,
      region_id: input.region_id,
      sales_channel_id: sales_channel.id
    }
  })

  await addToCartWorkflow.run({
    container,
    input: {
      cart_id: cart.id,
      items: input.items
    }
  })

  return cart
}

export async function createShippingOptions(
  cart_id: string,
  container: MedusaContainer
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [cart]
  } = await query.graph({
    entity: 'cart',
    fields: ['*', 'items.*'],
    filters: {
      id: cart_id
    }
  })

  const productIds = cart.items.map((i) => i.product_id)

  const { data: sellersInOrder } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['seller_id', 'product_id'],
    filters: {
      product_id: productIds
    }
  })

  const sellers = [...new Set(sellersInOrder.map((s) => s.seller_id))]

  const { data: options } = await query.graph({
    entity: sellerShippingOption.entryPoint,
    fields: ['seller_id', 'shipping_option_id'],
    filters: {
      seller_id: sellers
    }
  })

  const optionsToAdd = sellers
    .map((seller_id) => options.find((o) => o.seller_id === seller_id))
    .map((o) => ({
      id: o.shipping_option_id
    }))

  await addShippingMethodToCartWorkflow.run({
    container,
    input: {
      cart_id: cart.id,
      options: optionsToAdd
    }
  })
}
