import { fakerPL as faker } from '@faker-js/faker'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createOrderWorkflow } from '@medusajs/medusa/core-flows'

import sellerProduct from '../../../links/seller-product'
import { SELLER_MODULE } from '../../../modules/seller'
import { CreateQuickOrderType } from './validators'

export const POST = async (
  req: MedusaRequest<CreateQuickOrderType>,
  res: MedusaResponse
) => {
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const address = {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    province: faker.location.state(),
    address_1: faker.location.streetAddress(),
    address_2: faker.location.secondaryAddress(),
    country_code: 'PL'
  }

  const { result: order } = await createOrderWorkflow.run({
    container: req.scope,
    input: {
      email: faker.internet.email({
        firstName: address.first_name,
        lastName: address.last_name
      }),
      shipping_address: address,
      billing_address: address,
      items: req.validatedBody.items,
      region_id: req.validatedBody.region_id
    }
  })

  const {
    data: [product]
  } = await query.graph({
    entity: 'product_variant',
    fields: ['product_id'],
    filters: {
      id: req.validatedBody.items[0].variant_id
    }
  })

  const {
    data: [seller]
  } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['seller_id'],
    filters: {
      product_id: product.product_id
    }
  })

  await remoteLink.create({
    [SELLER_MODULE]: {
      seller_id: seller.seller_id
    },
    [Modules.ORDER]: {
      order_id: order.id
    }
  })

  res.json({ order })
}
