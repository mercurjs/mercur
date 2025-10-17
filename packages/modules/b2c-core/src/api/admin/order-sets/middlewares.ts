import { validateAndTransformQuery } from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { adminOrderSetQueryConfig } from './query-config'
import { AdminOrderSetParams } from './validators'

export const orderSetsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/order-sets',
    middlewares: [
      validateAndTransformQuery(
        AdminOrderSetParams,
        adminOrderSetQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/order-sets/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminOrderSetParams,
        adminOrderSetQueryConfig.retrieve
      )
    ]
  }
]
