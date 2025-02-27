import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorCustomerGroupsQueryConfig } from './query-config'
import { VendorGetCustomerGroupsParams } from './validators'

export const vendorCustomerGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/customer-groups',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomerGroupsParams,
        vendorCustomerGroupsQueryConfig.list
      )
    ]
  }
]
