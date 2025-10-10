import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { listPricePreferenceQueryConfig } from './query-config'
import { VendorGetPricePreferencesParams } from './validators'

export const vendorPricePreferencesRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/price-preferences',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPricePreferencesParams,
        listPricePreferenceQueryConfig
      )
    ]
  }
]
