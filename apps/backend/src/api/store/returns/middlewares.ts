import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { storeReturnQueryConfig } from './query-config'
import { StoreGetReturnsParams } from './validators'

export const storeReturnsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/returns',
    middlewares: [
      validateAndTransformQuery(
        StoreGetReturnsParams,
        storeReturnQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/returns/:id',
    middlewares: [
      validateAndTransformQuery(
        StoreGetReturnsParams,
        storeReturnQueryConfig.retrieve
      )
    ]
  }
]
