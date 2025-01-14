import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

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
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/requests/:id',
    middlewares: [validateAndTransformBody(AdminReviewRequest)]
  }
]
