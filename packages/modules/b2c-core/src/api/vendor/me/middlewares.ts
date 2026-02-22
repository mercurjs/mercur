import { validateAndTransformQuery } from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { vendorMemberQueryConfig } from '../members/query-config'
import { VendorGetMemberParams } from '../members/validators'

export const vendorMeMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/me',
    middlewares: [
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.retrieve
      )
    ]
  }
]
