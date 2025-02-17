import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { adminSellerQueryConfig } from './query-config'
import { AdminSellerParams } from './validators'

export const sellerMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/sellers',
    middlewares: [
      validateAndTransformQuery(AdminSellerParams, adminSellerQueryConfig.list)
    ]
  }
]
