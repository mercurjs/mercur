import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { VendorGetStatisticsParams } from './validators'

export const vendorStatisticsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/statistics',
    middlewares: [validateAndTransformQuery(VendorGetStatisticsParams, {})]
  }
]
