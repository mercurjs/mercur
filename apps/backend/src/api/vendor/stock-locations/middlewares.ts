import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorStockLocationQueryConfig } from './query-config'
import { VendorGetStockLocationParams } from './validators'

export const vendorStockLocationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/stock-locations',
    middlewares: [
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.list
      )
    ]
  }
]
