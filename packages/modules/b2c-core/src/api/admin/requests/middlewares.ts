import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { applyRequestsStatusFilter } from '../../../shared/infra/http/middlewares/apply-request-status-filter'
import { applyRequestsTypeFilter } from '../../../shared/infra/http/middlewares/apply-request-type-filter'
import { adminRequestsConfig } from './query-config'
import { AdminGetRequestsParams, AdminReviewRequest } from './validators'

export const requestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/requests',
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestsConfig.list
      ),
      applyRequestsStatusFilter(),
      applyRequestsTypeFilter()
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/requests/:id',
    middlewares: [validateAndTransformBody(AdminReviewRequest)]
  },
  {
    method: ['GET'],
    matcher: '/admin/requests/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestsConfig.retrieve
      )
    ]
  }
]
