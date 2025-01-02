import { validateAndTransformQuery } from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { adminRequestsConfig } from './query-config'
import { AdminGetRequestsParams } from './validators'

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
  }
]
