import { fakerPL as faker } from '@faker-js/faker'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { createOrderWorkflow } from '@medusajs/medusa/core-flows'

import { CreateQuickOrderType } from './validators'

export const POST = async (
  req: MedusaRequest<CreateQuickOrderType>,
  res: MedusaResponse
) => {
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

  res.json({ order })
}
