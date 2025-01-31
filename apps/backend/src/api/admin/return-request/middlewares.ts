import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import { adminReturnOrderRequestQueryConfig } from './query-config'
import {
  AdminGetOrderReturnRequestParams,
  AdminUpdateOrderReturnRequest
} from './validators'

export const adminReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/return-request',
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderReturnRequestParams,
        adminReturnOrderRequestQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/return-request/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderReturnRequestParams,
        adminReturnOrderRequestQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/return-request/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderReturnRequestParams,
        adminReturnOrderRequestQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminUpdateOrderReturnRequest)
    ]
  }
]
