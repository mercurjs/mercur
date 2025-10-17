import { validateAndTransformQuery } from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import { vendorPayoutQueryConfig } from './query-config'
import { VendorGetPayoutParams } from './validators'

export const vendorPayoutMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/payouts',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPayoutParams,
        vendorPayoutQueryConfig.list
      ),
      filterBySellerId()
    ]
  }
]
