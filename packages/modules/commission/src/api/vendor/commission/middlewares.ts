import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorCommissionLinesQueryConfig } from './query-config'
import { VendorGetCommissionLinesParams } from './validators'

export const vendorCommissionMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/commission',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCommissionLinesParams,
        vendorCommissionLinesQueryConfig.list
      )
    ]
  }
]
