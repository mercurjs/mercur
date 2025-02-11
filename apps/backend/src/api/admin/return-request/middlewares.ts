import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import { applyRequestsStatusFilter } from '../../../shared/infra/http/middlewares/apply-request-status-filter'
import { adminReturnOrderRequestQueryConfig } from './query-config'
import {
  AdminGetOrderReturnRequestParams,
  AdminUpdateOrderReturnRequest
} from './validators'

export const returnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/return-request',
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderReturnRequestParams,
        adminReturnOrderRequestQueryConfig.list
      ),
      applyRequestsStatusFilter()
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
