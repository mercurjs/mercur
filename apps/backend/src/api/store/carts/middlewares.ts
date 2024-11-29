import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { storeCartsQueryConfig } from './query-config'
import { StoreGetCartParams } from './validators'

export const storeCartsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/store/carts/:id/complete',
    middlewares: [
      validateAndTransformQuery(
        StoreGetCartParams,
        storeCartsQueryConfig.retrieve
      )
    ]
  }
]
