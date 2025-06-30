import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createShippingProfilesWorkflow } from '@medusajs/medusa/core-flows'

import { SELLER_MODULE } from '@mercurjs/seller'

import { createSellerWorkflow } from '../seller/workflows'

createSellerWorkflow.hooks.sellerCreated(
  async ({ sellerId }, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const { result } = await createShippingProfilesWorkflow.run({
      container,
      input: {
        data: [
          {
            type: 'default',
            name: `${sellerId}:Default shipping profile`
          }
        ]
      }
    })

    await link.create({
      [SELLER_MODULE]: {
        seller_id: sellerId
      },
      [Modules.FULFILLMENT]: {
        shipping_profile_id: result[0].id
      }
    })
  }
)
