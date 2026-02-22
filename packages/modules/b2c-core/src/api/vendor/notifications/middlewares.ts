import { validateAndTransformQuery } from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { vendorNotificationQueryConfig } from './query-config'
import { VendorGetNotificationParams } from './validators'

export const vendorNotificationMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/notifications',
    middlewares: [
      validateAndTransformQuery(
        VendorGetNotificationParams,
        vendorNotificationQueryConfig.list
      )
    ]
  }
]
