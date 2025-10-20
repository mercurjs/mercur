import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { orderSetQueryConfig } from './query-config'
import { StoreGetOrderSetParams } from './validators'

export const storeOrderSetMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/order-set',
    middlewares: [
      validateAndTransformQuery(
        StoreGetOrderSetParams,
        orderSetQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/order-set/:id',
    middlewares: [
      validateAndTransformQuery(
        StoreGetOrderSetParams,
        orderSetQueryConfig.retrieve
      )
    ]
  }
]
