import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import {
  vendorCustomerOrdersQueryConfig,
  vendorCustomerQueryConfig
} from './query-config'
import {
  VendorGetCustomerOrdersParams,
  VendorGetCustomersParams
} from './validators'

export const vendorCustomersMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/customers',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomersParams,
        vendorCustomerQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/customers/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomersParams,
        vendorCustomerQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/customers/:id/orders',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomerOrdersParams,
        vendorCustomerOrdersQueryConfig.list
      )
    ]
  }
]
