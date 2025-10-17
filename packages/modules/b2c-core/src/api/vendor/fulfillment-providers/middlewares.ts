import { validateAndTransformQuery } from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { vendorFulfillmentProvidersQueryConfig } from './query-config'
import { VendorGetFulfillmentProvidersParams } from './validators'

export const vendorFulfillmentProvidersMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/fulfillment-providers',
    middlewares: [
      validateAndTransformQuery(
        VendorGetFulfillmentProvidersParams,
        vendorFulfillmentProvidersQueryConfig.list
      )
    ]
  }
]
