import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorSalesChannelQueryConfig } from './query-config'
import { VendorGetSalesChannelParams } from './validators'

export const vendorSalesChannelMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/sales-channels',
    middlewares: [
      validateAndTransformQuery(
        VendorGetSalesChannelParams,
        vendorSalesChannelQueryConfig.list
      )
    ]
  }
]
